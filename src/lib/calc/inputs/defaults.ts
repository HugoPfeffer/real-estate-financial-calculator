import type { BankPreset } from '../types';

const STORAGE_KEY = 'financing-simulator:bank-presets';

export const SHIPPED_DEFAULTS: BankPreset[] = [
	{ id: 'caixa', name: 'Caixa', annualRate: 10.49, referenceDate: 'Fev 2026', isDefault: true },
	{ id: 'bb', name: 'Banco do Brasil', annualRate: 12.0, referenceDate: 'Fev 2026', isDefault: true },
	{ id: 'itau', name: 'Itaú', annualRate: 11.6, referenceDate: 'Fev 2026', isDefault: true },
	{ id: 'santander', name: 'Santander', annualRate: 11.79, referenceDate: 'Fev 2026', isDefault: true },
	{ id: 'pro-cotista', name: 'Pro-Cotista (Caixa)', annualRate: 9.01, referenceDate: 'Fev 2026', isDefault: true }
];

export function loadPresets(): BankPreset[] {
	if (typeof window === 'undefined') return [...SHIPPED_DEFAULTS];
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) return [...SHIPPED_DEFAULTS];
		const parsed = JSON.parse(stored);
		if (!Array.isArray(parsed) || parsed.length === 0) return [...SHIPPED_DEFAULTS];
		return parsed;
	} catch {
		return [...SHIPPED_DEFAULTS];
	}
}

export function savePresets(presets: BankPreset[]): void {
	if (typeof window === 'undefined') return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

export function resetPresets(): BankPreset[] {
	const defaults = [...SHIPPED_DEFAULTS];
	savePresets(defaults);
	return defaults;
}
