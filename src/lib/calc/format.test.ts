import { describe, it, expect } from 'vitest';
import { formatBRL, formatPercent, parseBRL, round2 } from './format';

describe('formatBRL', () => {
	it('formats standard value', () => {
		expect(formatBRL(1234.56)).toBe('R$\u00a01.234,56');
	});

	it('formats zero', () => {
		expect(formatBRL(0)).toBe('R$\u00a00,00');
	});

	it('formats large value', () => {
		const result = formatBRL(2250000);
		expect(result).toContain('2.250.000');
	});
});

describe('formatPercent', () => {
	it('formats percentage', () => {
		expect(formatPercent(10.5)).toBe('10,50%');
	});

	it('formats integer percentage', () => {
		expect(formatPercent(12)).toBe('12,00%');
	});
});

describe('parseBRL', () => {
	it('parses pt-BR formatted currency', () => {
		expect(parseBRL('1.234,56')).toBe(1234.56);
	});

	it('parses value with R$ prefix', () => {
		expect(parseBRL('R$ 1.234,56')).toBe(1234.56);
	});

	it('parses simple number', () => {
		expect(parseBRL('500')).toBe(500);
	});

	it('returns 0 for empty string', () => {
		expect(parseBRL('')).toBe(0);
	});

	it('parses value with only comma decimal', () => {
		expect(parseBRL('1500,00')).toBe(1500);
	});
});

describe('round2', () => {
	it('rounds to 2 decimal places', () => {
		expect(round2(1.006)).toBe(1.01);
		expect(round2(1.004)).toBe(1);
		expect(round2(833.3333)).toBe(833.33);
	});
});
