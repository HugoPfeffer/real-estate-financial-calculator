import type { RawInputs, Schedule, ComparisonResult, BankPreset, PlanningResult } from '$lib/calc/types';
import { validate } from '$lib/calc/inputs/validate';
import { buildSchedule } from '$lib/calc/schedule/build';
import { compareSchedules } from '$lib/calc/analysis/compare';
import { simulatePlanningMode } from '$lib/calc/analysis/planning';
import { round2 } from '$lib/calc/format';
import { loadPresets, savePresets, resetPresets as resetPresetsToDefaults } from '$lib/calc/inputs/defaults';

const defaultInputs: RawInputs = {
	propertyValue: 0,
	downPaymentPercent: 30,
	termMonths: 360,
	annualInterestRate: 10.49,
	grossMonthlyIncome: 0,
	netMonthlyIncome: 0,
	fgtsBalance: 0,
	coBorrowerIncome: 0,
	monthlyTR: 0
};

let rawInputs = $state<RawInputs>({ ...defaultInputs });
let bankPresets = $state<BankPreset[]>(loadPresets());
let hasSimulated = $state(false);

// Planning mode state
let planningMode = $state(false);
let paidUpToMonth = $state(0);
let extraPaidMonths = $state(new Set<number>());
let extraModality = $state<'prazo' | 'parcela'>('prazo');
let activeTab = $state<'sac' | 'price'>('sac');

let validationResult = $derived(validate(rawInputs));
let sacSchedule = $derived(
	hasSimulated && validationResult.ok ? buildSchedule('sac', validationResult.data) : null
);
let priceSchedule = $derived(
	hasSimulated && validationResult.ok ? buildSchedule('price', validationResult.data) : null
);
let comparison = $derived(
	sacSchedule && priceSchedule ? compareSchedules(sacSchedule, priceSchedule) : null
);

let incomeWarning = $derived.by(() => {
	if (!hasSimulated || !validationResult.ok || !sacSchedule || !priceSchedule) return null;
	const maxPayment = Math.max(sacSchedule.totals.firstPayment, priceSchedule.totals.firstPayment);
	const limit = validationResult.data.totalGrossIncome * 0.30;
	if (maxPayment > limit) {
		return `Parcela excede 30% da renda bruta mensal (R$ ${limit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`;
	}
	return null;
});

let planningResult = $derived.by((): PlanningResult | null => {
	if (!planningMode || extraPaidMonths.size === 0) return null;
	const baseSchedule = activeTab === 'sac' ? sacSchedule : priceSchedule;
	if (!baseSchedule) return null;
	return simulatePlanningMode(baseSchedule, paidUpToMonth, extraPaidMonths, extraModality);
});

function getBalanceAtWatermark(baseSchedule: Schedule): number {
	if (paidUpToMonth === 0) {
		return baseSchedule.periods[0].amortization + baseSchedule.periods[0].balance;
	}
	return baseSchedule.periods[paidUpToMonth - 1].balance;
}

function absorbContiguousExtras(): void {
	while (extraPaidMonths.has(paidUpToMonth + 1)) {
		paidUpToMonth += 1;
		extraPaidMonths.delete(paidUpToMonth);
	}
	// Evict any extras that fell below watermark
	for (const m of extraPaidMonths) {
		if (m <= paidUpToMonth) {
			extraPaidMonths.delete(m);
		}
	}
}

export function getSimulationState() {
	return {
		get rawInputs() { return rawInputs; },
		set rawInputs(v: RawInputs) { rawInputs = v; },
		get bankPresets() { return bankPresets; },
		get hasSimulated() { return hasSimulated; },
		get validationResult() { return validationResult; },
		get sacSchedule() { return sacSchedule; },
		get priceSchedule() { return priceSchedule; },
		get comparison() { return comparison; },
		get incomeWarning() { return incomeWarning; },

		// Planning mode state
		get planningMode() { return planningMode; },
		set planningMode(v: boolean) { planningMode = v; },
		get paidUpToMonth() { return paidUpToMonth; },
		get extraPaidMonths() { return extraPaidMonths; },
		get extraModality() { return extraModality; },
		set extraModality(v: 'prazo' | 'parcela') { extraModality = v; },
		get activeTab() { return activeTab; },
		set activeTab(v: 'sac' | 'price') { activeTab = v; },
		get planningResult() { return planningResult; },

		toggleMonth(month: number): void {
			const baseSchedule = activeTab === 'sac' ? sacSchedule : priceSchedule;
			if (!baseSchedule) return;

			const isSequential = month <= paidUpToMonth;
			const isExtra = extraPaidMonths.has(month);

			if (isSequential) {
				// Uncheck: only allow unchecking the last sequential month
				if (month === paidUpToMonth) {
					paidUpToMonth = paidUpToMonth - 1;
					absorbContiguousExtras();
					// Trigger reactivity
					extraPaidMonths = new Set(extraPaidMonths);
				}
			} else if (isExtra) {
				// Uncheck extra
				extraPaidMonths.delete(month);
				extraPaidMonths = new Set(extraPaidMonths);
			} else if (month === paidUpToMonth + 1) {
				// Check sequential extension
				paidUpToMonth = paidUpToMonth + 1;
				absorbContiguousExtras();
				extraPaidMonths = new Set(extraPaidMonths);
			} else {
				// Check extra (non-sequential)
				extraPaidMonths.add(month);
				extraPaidMonths = new Set(extraPaidMonths);
				absorbContiguousExtras();
				extraPaidMonths = new Set(extraPaidMonths);
			}
		},

		canCheck(month: number): boolean {
			const baseSchedule = activeTab === 'sac' ? sacSchedule : priceSchedule;
			if (!baseSchedule || month <= paidUpToMonth || extraPaidMonths.has(month)) return false;

			// Sequential extension is always allowed (it's a regular payment)
			if (month === paidUpToMonth + 1) return true;

			// For extras: check balance overflow
			const bal = getBalanceAtWatermark(baseSchedule);
			let currentExtra = 0;
			for (const m of extraPaidMonths) {
				currentExtra += baseSchedule.periods[m - 1].amortization;
			}
			currentExtra = round2(currentExtra);
			const thisAmort = baseSchedule.periods[month - 1].amortization;
			return round2(currentExtra + thisAmort) <= bal;
		},

		canUncheck(month: number): boolean {
			if (month < paidUpToMonth) return false;
			if (month === paidUpToMonth) return true;
			if (extraPaidMonths.has(month)) return true;
			return false;
		},

		simulate(formInputs: RawInputs) {
			rawInputs = { ...formInputs };
			hasSimulated = true;
			// Reset planning state when new base simulation runs
			planningMode = false;
			paidUpToMonth = 0;
			extraPaidMonths = new Set();
			extraModality = 'prazo';
		},

		updatePresets(presets: BankPreset[]) {
			bankPresets = presets;
			savePresets(presets);
		},

		resetPresets() {
			bankPresets = resetPresetsToDefaults();
		}
	};
}
