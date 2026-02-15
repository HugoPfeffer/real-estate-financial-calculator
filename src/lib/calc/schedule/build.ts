import type { Schedule, Totals, ValidatedInputs } from '../types';
import { generateSACPeriods } from '../engines/sac';
import { generatePricePeriods } from '../engines/price';
import { round2 } from '../format';

function computeTotals(periods: import('../types').Period[]): Totals {
	let totalPayment = 0;
	let totalInterest = 0;
	let totalAmortization = 0;

	for (const p of periods) {
		totalPayment += p.payment;
		totalInterest += p.interest;
		totalAmortization += p.amortization;
	}

	return {
		totalPayment: round2(totalPayment),
		totalInterest: round2(totalInterest),
		totalAmortization: round2(totalAmortization),
		firstPayment: periods[0].payment,
		lastPayment: periods[periods.length - 1].payment
	};
}

export function buildSchedule(system: 'sac' | 'price', inputs: ValidatedInputs): Schedule {
	const { financedAmount: PV, termMonths: n, monthlyInterestRate: i, monthlyTR } = inputs;
	const tr = monthlyTR ? monthlyTR / 100 : 0;

	const periods =
		system === 'sac'
			? generateSACPeriods(PV, n, i, tr)
			: generatePricePeriods(PV, n, i, tr);

	return {
		system,
		periods,
		totals: computeTotals(periods),
		monthlyRate: i
	};
}
