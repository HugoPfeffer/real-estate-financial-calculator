import { describe, it, expect } from 'vitest';
import { validate } from './validate';
import type { RawInputs } from '../types';

function validInputs(overrides: Partial<RawInputs> = {}): RawInputs {
	return {
		propertyValue: 500_000,
		downPaymentPercent: 20,
		termMonths: 360,
		annualInterestRate: 10,
		grossMonthlyIncome: 15_000,
		netMonthlyIncome: 12_000,
		fgtsBalance: 0,
		coBorrowerIncome: 0,
		monthlyTR: 0,
		...overrides
	};
}

describe('validate', () => {
	it('accepts valid inputs', () => {
		const result = validate(validInputs());
		expect(result.ok).toBe(true);
	});

	it('rejects property value above SFH ceiling', () => {
		const result = validate(validInputs({ propertyValue: 3_000_000 }));
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors[0].message).toContain('teto do SFH');
		}
	});

	it('rejects down payment below 20%', () => {
		const result = validate(validInputs({ downPaymentPercent: 10 }));
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors[0].message).toContain('20%');
		}
	});

	it('rejects rate above 12%', () => {
		const result = validate(validInputs({ annualInterestRate: 15 }));
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors[0].message).toContain('12%');
		}
	});

	it('rejects FGTS when property exceeds R$ 1.500.000', () => {
		const result = validate(validInputs({ propertyValue: 2_000_000, fgtsBalance: 50_000 }));
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors.some((e) => e.message.includes('FGTS'))).toBe(true);
		}
	});

	it('rejects zero property value', () => {
		const result = validate(validInputs({ propertyValue: 0 }));
		expect(result.ok).toBe(false);
	});

	it('rejects zero gross income', () => {
		const result = validate(validInputs({ grossMonthlyIncome: 0 }));
		expect(result.ok).toBe(false);
	});

	it('computes financed amount correctly', () => {
		const result = validate(validInputs({ propertyValue: 500_000, downPaymentPercent: 20 }));
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.data.financedAmount).toBe(400_000);
		}
	});

	it('converts annual rate to monthly (compound)', () => {
		const result = validate(validInputs({ annualInterestRate: 10 }));
		expect(result.ok).toBe(true);
		if (result.ok) {
			// 10% a.a. → ~0.7974% a.m.
			expect(result.data.monthlyInterestRate).toBeCloseTo(0.007974, 4);
		}
	});

	it('computes total gross income with co-borrower', () => {
		const result = validate(validInputs({ grossMonthlyIncome: 10_000, coBorrowerIncome: 5_000 }));
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.data.totalGrossIncome).toBe(15_000);
		}
	});
});
