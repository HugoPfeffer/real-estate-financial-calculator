import { describe, it, expect } from 'vitest';
import { generatePricePeriods, computePMT } from './price';

describe('Price Engine', () => {
	it('PV=10000, n=12, i=0.01: PMT=888.49', () => {
		const PMT = computePMT(10_000, 12, 0.01);
		expect(PMT).toBeCloseTo(888.49, 0);
	});

	it('PV=10000, n=12, i=0.01: total interest ≈ 661.88', () => {
		const periods = generatePricePeriods(10_000, 12, 0.01);
		const totalInterest = periods.reduce((sum, p) => sum + p.interest, 0);
		// With per-period rounding, total interest is 661.88 (PMT=888.49 × 12 - 10000)
		expect(totalInterest).toBeCloseTo(661.88, 0);
	});

	it('PV=30000, n=12, i=0.015: PMT=2750.40', () => {
		const PMT = computePMT(30_000, 12, 0.015);
		expect(PMT).toBeCloseTo(2750.40, 0);
	});

	it('amortization grows geometrically', () => {
		const periods = generatePricePeriods(10_000, 12, 0.01);
		for (let i = 0; i < periods.length - 2; i++) {
			const ratio = periods[i + 1].amortization / periods[i].amortization;
			expect(ratio).toBeCloseTo(1.01, 1);
		}
	});

	it('final balance is exactly 0', () => {
		const periods = generatePricePeriods(10_000, 12, 0.01);
		expect(periods[periods.length - 1].balance).toBe(0);
	});

	it('produces correct number of periods', () => {
		const periods = generatePricePeriods(100_000, 360, 0.008);
		expect(periods.length).toBe(360);
	});
});
