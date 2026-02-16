import type { Schedule, PlanningResult } from '../types';
import { round2 } from '../format';
import { generateSACPeriods } from '../engines/sac';
import { generatePricePeriods } from '../engines/price';

/**
 * Solve for the number of remaining Price periods given a reduced balance
 * and the original constant PMT.
 *
 * n = ln(PMT / (PMT - newBalance * i)) / ln(1 + i)
 */
export function solveNRemainingPrice(newBalance: number, PMT: number, i: number): number {
	const denominator = PMT - newBalance * i;
	if (denominator <= 0) {
		throw new Error('PMT cannot cover interest on reduced balance');
	}
	return Math.ceil(Math.log(PMT / denominator) / Math.log(1 + i));
}

export function simulatePlanningMode(
	baseSchedule: Schedule,
	paidUpToMonth: number,
	extraPaidMonths: Set<number>,
	modality: 'prazo' | 'parcela'
): PlanningResult {
	const { system, periods: basePeriods, monthlyRate: i } = baseSchedule;

	// F1: Balance at watermark
	let balanceAtWatermark: number;
	if (paidUpToMonth === 0) {
		balanceAtWatermark = basePeriods[0].amortization + basePeriods[0].balance;
	} else {
		balanceAtWatermark = basePeriods[paidUpToMonth - 1].balance;
	}

	// F2: Extra principal
	let extraPrincipal = 0;
	for (const m of extraPaidMonths) {
		extraPrincipal += basePeriods[m - 1].amortization;
	}
	extraPrincipal = round2(extraPrincipal);

	// F3: New balance
	let newBalance = round2(balanceAtWatermark - extraPrincipal);
	if (newBalance < 0) newBalance = 0;

	// Edge case: fully paid
	if (newBalance === 0) {
		// Sequential totals
		let sequentialPayments = 0;
		let sequentialInterest = 0;
		for (let m = 1; m <= paidUpToMonth; m++) {
			sequentialPayments += basePeriods[m - 1].payment;
			sequentialInterest += basePeriods[m - 1].interest;
		}
		sequentialPayments = round2(sequentialPayments);
		sequentialInterest = round2(sequentialInterest);

		const totalPayment = round2(sequentialPayments + extraPrincipal);
		const totalInterest = sequentialInterest;

		return {
			modified: {
				system,
				periods: [],
				totals: {
					totalPayment,
					totalInterest,
					totalAmortization: round2(balanceAtWatermark),
					firstPayment: 0,
					lastPayment: 0
				},
				monthlyRate: i
			},
			savings: {
				interestSaved: round2(baseSchedule.totals.totalInterest - totalInterest),
				termReduction: basePeriods.length - paidUpToMonth,
				totalSaved: round2(baseSchedule.totals.totalPayment - totalPayment)
			}
		};
	}

	// F4: Determine nRemaining
	let nRemaining: number;
	const tr = 0; // TR passed through as 0 for now (base schedule already accounts for it)

	if (modality === 'prazo') {
		if (system === 'sac') {
			// F4a: Keep original A, solve for term
			const A_original = basePeriods[0].amortization;
			nRemaining = Math.ceil(newBalance / A_original);
		} else {
			// F4b: Keep original PMT, solve for term
			const PMT = basePeriods[0].payment;
			nRemaining = solveNRemainingPrice(newBalance, PMT, i);
		}
	} else {
		// F4c: Parcela — keep original remaining term
		nRemaining = basePeriods.length - paidUpToMonth;
	}

	// F5: Generate modified periods
	let modifiedPeriods =
		system === 'sac'
			? generateSACPeriods(newBalance, nRemaining, i, tr)
			: generatePricePeriods(newBalance, nRemaining, i, tr);

	// Renumber months
	for (const period of modifiedPeriods) {
		period.month = paidUpToMonth + period.month;
	}

	// F6: Compute modified totals
	let sequentialPayments = 0;
	let sequentialInterest = 0;
	for (let m = 1; m <= paidUpToMonth; m++) {
		sequentialPayments += basePeriods[m - 1].payment;
		sequentialInterest += basePeriods[m - 1].interest;
	}
	sequentialPayments = round2(sequentialPayments);
	sequentialInterest = round2(sequentialInterest);

	let remainingPayments = 0;
	let remainingInterest = 0;
	for (const p of modifiedPeriods) {
		remainingPayments += p.payment;
		remainingInterest += p.interest;
	}
	remainingPayments = round2(remainingPayments);
	remainingInterest = round2(remainingInterest);

	const totalPayment = round2(sequentialPayments + extraPrincipal + remainingPayments);
	const totalInterest = round2(sequentialInterest + remainingInterest);

	// F7: Savings
	const interestSaved = round2(baseSchedule.totals.totalInterest - totalInterest);
	const termReduction = basePeriods.length - (paidUpToMonth + modifiedPeriods.length);
	const totalSaved = round2(baseSchedule.totals.totalPayment - totalPayment);

	return {
		modified: {
			system,
			periods: modifiedPeriods,
			totals: {
				totalPayment,
				totalInterest,
				totalAmortization: round2(sequentialPayments - sequentialInterest + extraPrincipal + newBalance),
				firstPayment: modifiedPeriods[0]?.payment || 0,
				lastPayment: modifiedPeriods[modifiedPeriods.length - 1]?.payment || 0
			},
			monthlyRate: i
		},
		savings: {
			interestSaved,
			termReduction,
			totalSaved
		}
	};
}
