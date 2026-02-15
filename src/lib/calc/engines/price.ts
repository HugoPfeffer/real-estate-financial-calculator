import type { Period } from '../types';
import { round2 } from '../format';

export function computePMT(PV: number, n: number, i: number): number {
	const factor = Math.pow(1 + i, n);
	return round2(PV * (i * factor) / (factor - 1));
}

export function generatePricePeriods(PV: number, n: number, i: number, tr: number = 0): Period[] {
	const periods: Period[] = [];
	const PMT = computePMT(PV, n, i);
	let balance = PV;
	let cumulativeInterest = 0;
	let cumulativeAmortization = 0;

	for (let t = 1; t <= n; t++) {
		const correctedBalance = tr > 0 ? balance * (1 + tr) : balance;
		const interest = round2(correctedBalance * i);
		const isLast = t === n;
		const amortization = isLast ? round2(balance) : round2(PMT - interest);
		const payment = isLast ? round2(amortization + interest) : PMT;
		const actualBalance = tr > 0 ? correctedBalance : balance;

		cumulativeInterest = round2(cumulativeInterest + interest);
		cumulativeAmortization = round2(cumulativeAmortization + amortization);
		balance = isLast ? 0 : round2(actualBalance - amortization);

		periods.push({
			month: t,
			payment,
			amortization,
			interest,
			balance,
			cumulativeInterest,
			cumulativeAmortization
		});
	}

	return periods;
}
