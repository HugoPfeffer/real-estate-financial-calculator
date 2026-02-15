import type { Period } from '../types';
import { round2 } from '../format';

export function generateSACPeriods(PV: number, n: number, i: number, tr: number = 0): Period[] {
	const periods: Period[] = [];
	const A = round2(PV / n);
	let balance = PV;
	let cumulativeInterest = 0;
	let cumulativeAmortization = 0;

	for (let t = 1; t <= n; t++) {
		const correctedBalance = tr > 0 ? balance * (1 + tr) : balance;
		const interest = round2(correctedBalance * i);
		const isLast = t === n;
		const amortization = isLast ? round2(balance) : A;
		const actualBalance = tr > 0 ? correctedBalance : balance;
		const payment = round2(amortization + interest);

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
