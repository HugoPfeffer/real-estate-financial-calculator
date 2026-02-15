import { describe, it, expect } from 'vitest';
import { generateSACPeriods } from './sac';

describe('SAC Engine', () => {
	it('PV=100000, n=120, i=0.01: P_1=1833.33, total interest=60500.00', () => {
		const periods = generateSACPeriods(100_000, 120, 0.01);

		expect(periods[0].payment).toBeCloseTo(1833.33, 1);
		expect(periods[0].amortization).toBeCloseTo(833.33, 1);
		expect(periods[0].interest).toBe(1000);

		const totalInterest = periods.reduce((sum, p) => sum + p.interest, 0);
		expect(totalInterest).toBeCloseTo(60_500, 0);
	});

	it('PV=10000, n=5, i=0.10: P_1=3000.00, total interest=3000.00', () => {
		const periods = generateSACPeriods(10_000, 5, 0.10);

		expect(periods[0].payment).toBe(3000);
		expect(periods[0].amortization).toBe(2000);
		expect(periods[0].interest).toBe(1000);

		const totalInterest = periods.reduce((sum, p) => sum + p.interest, 0);
		expect(totalInterest).toBeCloseTo(3000, 0);
	});

	it('payments decrease linearly', () => {
		const periods = generateSACPeriods(100_000, 120, 0.01);
		const decrease = periods[0].payment - periods[1].payment;

		for (let i = 1; i < Math.min(periods.length - 2, 10); i++) {
			const diff = periods[i].payment - periods[i + 1].payment;
			expect(diff).toBeCloseTo(decrease, 0);
		}
	});

	it('final balance is exactly 0', () => {
		const periods = generateSACPeriods(100_000, 120, 0.01);
		expect(periods[periods.length - 1].balance).toBe(0);
	});

	it('produces correct number of periods', () => {
		const periods = generateSACPeriods(100_000, 360, 0.008);
		expect(periods.length).toBe(360);
	});
});
