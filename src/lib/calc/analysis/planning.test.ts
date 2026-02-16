import { describe, it, expect } from 'vitest';
import { simulatePlanningMode, solveNRemainingPrice } from './planning';
import { generateSACPeriods } from '../engines/sac';
import { generatePricePeriods, computePMT } from '../engines/price';
import { round2 } from '../format';
import type { Schedule } from '../types';

function buildSACSchedule(PV: number, n: number, i: number): Schedule {
	const periods = generateSACPeriods(PV, n, i);
	let totalPayment = 0;
	let totalInterest = 0;
	let totalAmortization = 0;
	for (const p of periods) {
		totalPayment += p.payment;
		totalInterest += p.interest;
		totalAmortization += p.amortization;
	}
	return {
		system: 'sac',
		periods,
		totals: {
			totalPayment: round2(totalPayment),
			totalInterest: round2(totalInterest),
			totalAmortization: round2(totalAmortization),
			firstPayment: periods[0].payment,
			lastPayment: periods[periods.length - 1].payment
		},
		monthlyRate: i
	};
}

function buildPriceSchedule(PV: number, n: number, i: number): Schedule {
	const periods = generatePricePeriods(PV, n, i);
	let totalPayment = 0;
	let totalInterest = 0;
	let totalAmortization = 0;
	for (const p of periods) {
		totalPayment += p.payment;
		totalInterest += p.interest;
		totalAmortization += p.amortization;
	}
	return {
		system: 'price',
		periods,
		totals: {
			totalPayment: round2(totalPayment),
			totalInterest: round2(totalInterest),
			totalAmortization: round2(totalAmortization),
			firstPayment: periods[0].payment,
			lastPayment: periods[periods.length - 1].payment
		},
		monthlyRate: i
	};
}

describe('solveNRemainingPrice', () => {
	it('round-trip: PV=100k, n=10, i=0.01 yields n=10', () => {
		const PMT = computePMT(100_000, 10, 0.01);
		const n = solveNRemainingPrice(100_000, PMT, 0.01);
		expect(n).toBe(10);
	});

	it('reduced balance: PV=50k, PMT=10558.21, i=0.01 yields n=5', () => {
		const PMT = computePMT(100_000, 10, 0.01);
		const n = solveNRemainingPrice(50_000, PMT, 0.01);
		expect(n).toBe(5);
	});

	it('throws when PMT cannot cover interest', () => {
		expect(() => solveNRemainingPrice(1_000_000, 100, 0.01)).toThrow();
	});
});

describe('simulatePlanningMode', () => {
	describe('SAC prazo', () => {
		it('PV=120k, n=12, i=0.01, watermark=3, extras={10,11,12}', () => {
			const schedule = buildSACSchedule(120_000, 12, 0.01);

			const result = simulatePlanningMode(
				schedule,
				3,
				new Set([10, 11, 12]),
				'prazo'
			);

			// F1: balanceAtWatermark = period[2].balance = 90000
			// F2: extraPrincipal = 3 * 10000 = 30000
			// F3: newBalance = 90000 - 30000 = 60000
			// F4a: nRemaining = ceil(60000 / 10000) = 6
			expect(result.modified.periods.length).toBe(6);

			// F7: interestSaved = 7800 - 5400 = 2400
			expect(result.savings.interestSaved).toBe(2400);

			// F7: termReduction = 12 - (3 + 6) = 3
			expect(result.savings.termReduction).toBe(3);

			// F6: totalPayment = 33300 + 30000 + 62100 = 125400
			expect(result.modified.totals.totalPayment).toBe(125400);

			// F6: totalInterest = 3300 + 2100 = 5400
			expect(result.modified.totals.totalInterest).toBe(5400);

			// F7: totalSaved = 127800 - 125400 = 2400
			expect(result.savings.totalSaved).toBe(2400);

			// Periods are renumbered from watermark+1
			expect(result.modified.periods[0].month).toBe(4);
			expect(result.modified.periods[5].month).toBe(9);
		});
	});

	describe('SAC parcela', () => {
		it('PV=100k, n=10, i=0.01, watermark=2, extras={9,10}', () => {
			const schedule = buildSACSchedule(100_000, 10, 0.01);

			const result = simulatePlanningMode(
				schedule,
				2,
				new Set([9, 10]),
				'parcela'
			);

			// F1: balanceAtWatermark = period[1].balance = 80000
			// F2: extraPrincipal = 2 * 10000 = 20000
			// F3: newBalance = 80000 - 20000 = 60000
			// F4c: nRemaining = 10 - 2 = 8
			expect(result.modified.periods.length).toBe(8);

			// Parcela: no term reduction
			expect(result.savings.termReduction).toBe(0);

			// New A = 60000/8 = 7500
			expect(result.modified.periods[0].amortization).toBe(7500);

			// F7: interestSaved = 5500 - 4600 = 900
			expect(result.savings.interestSaved).toBe(900);

			// F6: totalPayment sequential(1-2) + extras(20000) + remaining
			// Sequential: 11000 + 10900 = 21900
			// Remaining: sum of (7500 + interest) for 8 periods
			// Remaining interest: 600+525+450+375+300+225+150+75 = 2700
			// Remaining payments: 7500*8 + 2700 = 62700
			// wait, let me re-examine...
			// Actually new balance = 60000, n=8, i=0.01
			// period 1: interest=600, A=7500, payment=8100
			// period 2: interest=525, A=7500, payment=8025
			// ...
			// Remaining interest: 600+525+450+375+300+225+150+75 = 2700
			// But actually the engine may have the last period slightly different (isLast logic)
			// Let's just verify totalInterest = sequentialInterest + remainingInterest
			// sequentialInterest = 1000 + 900 = 1900
			// So totalInterest = 1900 + 2700 = 4600
			expect(result.modified.totals.totalInterest).toBe(4600);

			// totalPayment = 21900 + 20000 + remainingPayments
			// remainingPayments = 8100+8025+7950+7875+7800+7725+7650+7575 = 62700
			// totalPayment = 21900 + 20000 + 62700 = 104600
			expect(result.modified.totals.totalPayment).toBe(104600);
		});
	});

	describe('Price prazo', () => {
		it('round-trip: PV=100k, n=10, i=0.01, no extras → nRemaining=10', () => {
			const schedule = buildPriceSchedule(100_000, 10, 0.01);

			// With watermark=0 and no extras, but we need at least 1 extra for the function to be meaningful
			// Actually the function is called even with extras — let's test with watermark=0, extras=empty
			// But in practice planningResult is null when extras is empty.
			// Let's verify by calling with some extras
			const result = simulatePlanningMode(
				schedule,
				0,
				new Set<number>(),
				'prazo'
			);
			// With 0 extras, extraPrincipal = 0, newBalance = PV = 100000
			// nRemaining for Price prazo = solveNRemainingPrice(100000, PMT, 0.01) = 10
			expect(result.modified.periods.length).toBe(10);
		});

		it('with extras: term shortens, interest saved > 0', () => {
			const schedule = buildPriceSchedule(100_000, 10, 0.01);

			// Check last 2 months as extras
			const result = simulatePlanningMode(
				schedule,
				0,
				new Set([9, 10]),
				'prazo'
			);

			expect(result.modified.periods.length).toBeLessThan(10);
			expect(result.savings.interestSaved).toBeGreaterThan(0);
			expect(result.savings.termReduction).toBeGreaterThan(0);
		});
	});

	describe('edge cases', () => {
		it('newBalance = 0 → empty modified periods', () => {
			const schedule = buildSACSchedule(120_000, 12, 0.01);

			// Check all 12 months as extras with watermark=0
			const allMonths = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
			const result = simulatePlanningMode(schedule, 0, allMonths, 'prazo');

			expect(result.modified.periods.length).toBe(0);
			expect(result.savings.termReduction).toBe(12);
			expect(result.savings.interestSaved).toBe(schedule.totals.totalInterest);
		});

		it('single extra month → correct deduction', () => {
			const schedule = buildSACSchedule(120_000, 12, 0.01);

			const result = simulatePlanningMode(
				schedule,
				3,
				new Set([12]),
				'prazo'
			);

			// extraPrincipal = 10000 (one month)
			// newBalance = 90000 - 10000 = 80000
			// nRemaining = ceil(80000/10000) = 8
			expect(result.modified.periods.length).toBe(8);
			expect(result.savings.termReduction).toBe(1); // 12 - (3 + 8) = 1
		});
	});
});
