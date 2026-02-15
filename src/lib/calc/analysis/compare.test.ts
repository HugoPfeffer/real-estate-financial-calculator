import { describe, it, expect } from 'vitest';
import { compareSchedules } from './compare';
import { buildSchedule } from '../schedule/build';
import type { ValidatedInputs } from '../types';

function makeInputs(): ValidatedInputs {
	const annualRate = 10;
	return {
		propertyValue: 500_000,
		downPaymentPercent: 20,
		termMonths: 120,
		annualInterestRate: annualRate,
		grossMonthlyIncome: 15_000,
		netMonthlyIncome: 12_000,
		fgtsBalance: 0,
		coBorrowerIncome: 0,
		monthlyTR: 0,
		financedAmount: 400_000,
		monthlyInterestRate: Math.pow(1 + annualRate / 100, 1 / 12) - 1,
		totalGrossIncome: 15_000
	};
}

describe('compareSchedules', () => {
	it('interestSaved is positive', () => {
		const inputs = makeInputs();
		const sac = buildSchedule('sac', inputs);
		const price = buildSchedule('price', inputs);
		const result = compareSchedules(sac, price);

		expect(result.interestSaved).toBeGreaterThan(0);
	});

	it('has correct ComparisonResult fields', () => {
		const inputs = makeInputs();
		const sac = buildSchedule('sac', inputs);
		const price = buildSchedule('price', inputs);
		const result = compareSchedules(sac, price);

		expect(result.sacTotals).toBeDefined();
		expect(result.priceTotals).toBeDefined();
		expect(typeof result.interestSaved).toBe('number');
		expect(typeof result.firstPaymentDelta).toBe('number');
	});

	it('firstPaymentDelta is SAC P1 minus Price PMT', () => {
		const inputs = makeInputs();
		const sac = buildSchedule('sac', inputs);
		const price = buildSchedule('price', inputs);
		const result = compareSchedules(sac, price);

		expect(result.firstPaymentDelta).toBeCloseTo(
			sac.totals.firstPayment - price.totals.firstPayment,
			2
		);
	});
});
