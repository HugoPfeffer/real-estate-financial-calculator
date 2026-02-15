import { describe, it, expect } from 'vitest';
import { buildSchedule } from './build';
import type { ValidatedInputs } from '../types';

function makeInputs(overrides: Partial<ValidatedInputs> = {}): ValidatedInputs {
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
		totalGrossIncome: 15_000,
		...overrides
	};
}

describe('Schedule Builder', () => {
	it('SAC total interest is less than Price total interest', () => {
		const inputs = makeInputs();
		const sac = buildSchedule('sac', inputs);
		const price = buildSchedule('price', inputs);

		expect(sac.totals.totalInterest).toBeLessThan(price.totals.totalInterest);
	});

	it('SAC schedule has correct system label', () => {
		const sac = buildSchedule('sac', makeInputs());
		expect(sac.system).toBe('sac');
	});

	it('Price schedule has correct system label', () => {
		const price = buildSchedule('price', makeInputs());
		expect(price.system).toBe('price');
	});

	it('schedules have correct number of periods', () => {
		const inputs = makeInputs({ termMonths: 120 });
		const sac = buildSchedule('sac', inputs);
		expect(sac.periods.length).toBe(120);
	});

	it('totals first and last payment are set', () => {
		const sac = buildSchedule('sac', makeInputs());
		expect(sac.totals.firstPayment).toBeGreaterThan(0);
		expect(sac.totals.lastPayment).toBeGreaterThan(0);
		expect(sac.totals.firstPayment).toBeGreaterThan(sac.totals.lastPayment);
	});
});
