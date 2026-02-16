import { describe, it, expect } from 'vitest';
import { simulatePlanningMode } from './planning';
import { generateSACPeriods } from '../engines/sac';
import { generatePricePeriods } from '../engines/price';
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

describe('Planning mode integration', () => {
	it('full flow: base schedule → watermark → extras → result', () => {
		const schedule = buildSACSchedule(120_000, 12, 0.01);

		// Simulate watermark at 3, extras at 10,11,12
		const result = simulatePlanningMode(schedule, 3, new Set([10, 11, 12]), 'prazo');

		expect(result.modified.system).toBe('sac');
		expect(result.modified.periods.length).toBe(6);
		expect(result.modified.periods[0].month).toBe(4);
		expect(result.modified.periods[5].month).toBe(9);
		expect(result.savings.interestSaved).toBe(2400);
		expect(result.savings.termReduction).toBe(3);
	});

	it('watermark absorption: extras {11,12,13} with watermark=10 → watermark=13', () => {
		// This tests the algorithm at the store level, but we can verify the engine result
		// when called with the absorbed state
		const schedule = buildSACSchedule(120_000, 24, 0.01);

		// After absorption: watermark=13, extras={15}
		const result = simulatePlanningMode(schedule, 13, new Set([15]), 'prazo');

		expect(result.modified.periods[0].month).toBe(14);
		expect(result.savings.termReduction).toBeGreaterThan(0);
	});

	it('balance overflow: enough extras to exceed balance → verify engine caps at 0', () => {
		const schedule = buildSACSchedule(120_000, 12, 0.01);
		// Each A = 10000. With watermark=0, balance=120000. 12 extras = 120000 exactly.
		const allExtras = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
		const result = simulatePlanningMode(schedule, 0, allExtras, 'prazo');

		expect(result.modified.periods.length).toBe(0);
		expect(result.savings.termReduction).toBe(12);
	});

	it('modality switch: same extras, prazo vs parcela yield different results', () => {
		const schedule = buildSACSchedule(120_000, 12, 0.01);
		const extras = new Set([10, 11, 12]);

		const prazo = simulatePlanningMode(schedule, 3, extras, 'prazo');
		const parcela = simulatePlanningMode(schedule, 3, extras, 'parcela');

		// Prazo reduces term
		expect(prazo.savings.termReduction).toBe(3);
		// Parcela keeps same term (12 - 3 = 9 remaining)
		expect(parcela.savings.termReduction).toBe(0);
		expect(parcela.modified.periods.length).toBe(9);

		// Both save interest but different amounts
		expect(prazo.savings.interestSaved).toBeGreaterThan(0);
		expect(parcela.savings.interestSaved).toBeGreaterThan(0);
		// Prazo generally saves more interest than parcela
		expect(prazo.savings.interestSaved).toBeGreaterThanOrEqual(parcela.savings.interestSaved);
	});

	it('Price system: prazo reduces term', () => {
		const schedule = buildPriceSchedule(100_000, 120, 0.01);
		const extras = new Set([118, 119, 120]);

		const result = simulatePlanningMode(schedule, 0, extras, 'prazo');

		expect(result.modified.periods.length).toBeLessThan(120);
		expect(result.savings.termReduction).toBeGreaterThan(0);
		expect(result.savings.interestSaved).toBeGreaterThan(0);
	});

	it('Price system: parcela reduces payment', () => {
		const schedule = buildPriceSchedule(100_000, 120, 0.01);
		const extras = new Set([118, 119, 120]);

		const result = simulatePlanningMode(schedule, 0, extras, 'parcela');

		// Term stays at 120
		expect(result.modified.periods.length).toBe(120);
		expect(result.savings.termReduction).toBe(0);
		// But payments are reduced
		expect(result.modified.periods[0].payment).toBeLessThan(schedule.periods[0].payment);
		expect(result.savings.interestSaved).toBeGreaterThan(0);
	});
});
