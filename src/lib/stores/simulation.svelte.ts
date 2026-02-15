import type { RawInputs, Schedule, ComparisonResult, BankPreset, ExtraPayment, SavingsSummary } from '$lib/calc/types';
import { validate } from '$lib/calc/inputs/validate';
import { buildSchedule } from '$lib/calc/schedule/build';
import { compareSchedules } from '$lib/calc/analysis/compare';
import { simulateExtraAmortization, validateFgtsIntervals } from '$lib/calc/analysis/extra-amort';
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
let extraPayments = $state<ExtraPayment[]>([]);
let extraBaseSystem = $state<'sac' | 'price'>('sac');
let hasSimulatedExtra = $state(false);

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

let extraAmortResult = $derived.by(() => {
	if (!hasSimulatedExtra || extraPayments.length === 0) return null;
	const baseSchedule = extraBaseSystem === 'sac' ? sacSchedule : priceSchedule;
	if (!baseSchedule) return null;
	return simulateExtraAmortization(baseSchedule, extraPayments);
});

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
		get extraPayments() { return extraPayments; },
		set extraPayments(v: ExtraPayment[]) { extraPayments = v; },
		get extraBaseSystem() { return extraBaseSystem; },
		set extraBaseSystem(v: 'sac' | 'price') { extraBaseSystem = v; },
		get hasSimulatedExtra() { return hasSimulatedExtra; },
		get extraAmortResult() { return extraAmortResult; },

		simulate(formInputs: RawInputs) {
			rawInputs = { ...formInputs };
			hasSimulated = true;
			hasSimulatedExtra = false;
		},

		simulateExtra() {
			hasSimulatedExtra = true;
		},

		updatePresets(presets: BankPreset[]) {
			bankPresets = presets;
			savePresets(presets);
		},

		resetPresets() {
			bankPresets = resetPresetsToDefaults();
		},

		validateFgts() {
			return validateFgtsIntervals(extraPayments);
		}
	};
}
