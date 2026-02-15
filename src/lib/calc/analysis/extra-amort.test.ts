import { describe, it, expect } from 'vitest';
import { simulateExtraAmortization, validateFgtsIntervals } from './extra-amort';
import { buildSchedule } from '../schedule/build';
import type { ValidatedInputs, ExtraPayment } from '../types';

function makeInputs(): ValidatedInputs {
	const annualRate = 10;
	return {
		propertyValue: 500_000,
		downPaymentPercent: 20,
		termMonths: 360,
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

describe('Extra Amortization', () => {
	it('pontual payment reduces term and saves interest (prazo)', () => {
		const inputs = makeInputs();
		const sac = buildSchedule('sac', inputs);
		const extras: ExtraPayment[] = [
			{ type: 'pontual', amount: 50_000, month: 24, modality: 'prazo', isFgts: false }
		];

		const { modified, savings } = simulateExtraAmortization(sac, extras);

		expect(modified.periods.length).toBeLessThan(sac.periods.length);
		expect(savings.interestSaved).toBeGreaterThan(0);
		expect(savings.termReduction).toBeGreaterThan(0);
	});

	it('recurring extra payment saves progressively', () => {
		const inputs = makeInputs();
		const sac = buildSchedule('sac', inputs);
		const extras: ExtraPayment[] = [
			{ type: 'recorrente', amount: 500, month: 1, modality: 'prazo', isFgts: false }
		];

		const { savings } = simulateExtraAmortization(sac, extras);
		expect(savings.interestSaved).toBeGreaterThan(0);
	});

	it('full prepayment ends schedule at that month', () => {
		const inputs = makeInputs();
		const sac = buildSchedule('sac', inputs);
		const balance = sac.periods[23].balance;
		const extras: ExtraPayment[] = [
			{ type: 'pontual', amount: balance, month: 24, modality: 'prazo', isFgts: false }
		];

		const { modified } = simulateExtraAmortization(sac, extras);
		expect(modified.periods.length).toBe(24);
		expect(modified.periods[modified.periods.length - 1].balance).toBe(0);
	});
});

describe('FGTS interval validation', () => {
	it('accepts 24-month gap', () => {
		const extras: ExtraPayment[] = [
			{ type: 'pontual', amount: 10_000, month: 24, modality: 'prazo', isFgts: true },
			{ type: 'pontual', amount: 10_000, month: 48, modality: 'prazo', isFgts: true }
		];
		expect(validateFgtsIntervals(extras)).toBeNull();
	});

	it('rejects 12-month gap', () => {
		const extras: ExtraPayment[] = [
			{ type: 'pontual', amount: 10_000, month: 24, modality: 'prazo', isFgts: true },
			{ type: 'pontual', amount: 10_000, month: 36, modality: 'prazo', isFgts: true }
		];
		expect(validateFgtsIntervals(extras)).toContain('24 meses');
	});
});
