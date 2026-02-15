import type { Schedule, ExtraPayment, SavingsSummary, Period } from '../types';
import { round2 } from '../format';
import { computePMT } from '../engines/price';

interface ExtraAmortResult {
	modified: Schedule;
	savings: SavingsSummary;
}

export function validateFgtsIntervals(payments: ExtraPayment[]): string | null {
	const fgtsPayments = payments
		.filter((p) => p.isFgts)
		.sort((a, b) => a.month - b.month);

	for (let i = 1; i < fgtsPayments.length; i++) {
		const gap = fgtsPayments[i].month - fgtsPayments[i - 1].month;
		if (gap < 24) {
			return 'Intervalo mínimo de 24 meses entre usos do FGTS';
		}
	}
	return null;
}

export function simulateExtraAmortization(
	baseSchedule: Schedule,
	extraPayments: ExtraPayment[]
): ExtraAmortResult {
	const system = baseSchedule.system;
	const basePeriods = baseSchedule.periods;
	const i = basePeriods.length > 0
		? basePeriods[0].interest / basePeriods[0].balance
		: 0;

	// Build a map of extras by month (expanding recurring)
	const extrasMap = new Map<number, number>();
	for (const ep of extraPayments) {
		if (ep.type === 'pontual') {
			extrasMap.set(ep.month, (extrasMap.get(ep.month) || 0) + ep.amount);
		} else {
			// Recorrente: apply from start month to end
			for (let m = ep.month; m <= basePeriods.length; m++) {
				extrasMap.set(m, (extrasMap.get(m) || 0) + ep.amount);
			}
		}
	}

	// Determine modality from the first extra payment (simplified: use same modality for all)
	const modality = extraPayments[0]?.modality || 'prazo';

	const periods: Period[] = [];
	let balance = basePeriods[0].balance + basePeriods[0].amortization; // PV
	let A = system === 'sac' ? basePeriods[0].amortization : 0;
	let PMT = system === 'price' ? basePeriods[0].payment : 0;
	let cumulativeInterest = 0;
	let cumulativeAmortization = 0;
	let nRemaining = basePeriods.length;
	let t = 0;

	while (balance > 0.01 && t < basePeriods.length * 2) {
		t++;
		const interest = round2(balance * i);
		let amortization: number;
		let payment: number;

		if (system === 'sac') {
			amortization = Math.min(round2(A), round2(balance));
			payment = round2(amortization + interest);
		} else {
			payment = Math.min(PMT, round2(balance + interest));
			amortization = round2(payment - interest);
			if (amortization > balance) amortization = round2(balance);
		}

		cumulativeInterest = round2(cumulativeInterest + interest);
		cumulativeAmortization = round2(cumulativeAmortization + amortization);
		balance = round2(balance - amortization);

		periods.push({
			month: t,
			payment,
			amortization,
			interest,
			balance: Math.max(balance, 0),
			cumulativeInterest,
			cumulativeAmortization
		});

		// Apply extra at this month
		const extra = extrasMap.get(t);
		if (extra && balance > 0) {
			const actualExtra = Math.min(extra, balance);
			balance = round2(balance - actualExtra);
			cumulativeAmortization = round2(cumulativeAmortization + actualExtra);

			// Update last period's balance
			periods[periods.length - 1].balance = Math.max(balance, 0);
			periods[periods.length - 1].cumulativeAmortization = cumulativeAmortization;

			if (balance <= 0.01) {
				balance = 0;
				periods[periods.length - 1].balance = 0;
				break;
			}

			nRemaining = basePeriods.length - t;
			if (modality === 'parcela') {
				// Reduce payment, keep term
				if (system === 'sac') {
					A = round2(balance / nRemaining);
				} else {
					PMT = computePMT(balance, nRemaining, i);
				}
			}
			// prazo: keep same A/PMT, term naturally shortens
		}
	}

	// Compute totals
	let totalPayment = 0;
	let totalInterest = 0;
	let totalAmortization = 0;
	for (const p of periods) {
		totalPayment += p.payment;
		totalInterest += p.interest;
		totalAmortization += p.amortization;
	}
	// Add extra payments to totalPayment
	for (const [, amt] of extrasMap) {
		totalPayment += amt;
	}

	const modified: Schedule = {
		system,
		periods,
		totals: {
			totalPayment: round2(totalPayment),
			totalInterest: round2(totalInterest),
			totalAmortization: round2(totalAmortization),
			firstPayment: periods[0]?.payment || 0,
			lastPayment: periods[periods.length - 1]?.payment || 0
		}
	};

	const savings: SavingsSummary = {
		interestSaved: round2(baseSchedule.totals.totalInterest - totalInterest),
		termReduction: baseSchedule.periods.length - periods.length,
		totalSaved: round2(baseSchedule.totals.totalPayment - totalPayment)
	};

	return { modified, savings };
}
