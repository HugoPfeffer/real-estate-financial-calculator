<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Alert from '$lib/components/ui/alert';
	import BankPresetManager from './BankPresetManager.svelte';
	import { getSimulationState } from '$lib/stores/simulation.svelte';
	import { formatBRL, parseBRL } from '$lib/calc/format';
	import type { RawInputs, BankPreset } from '$lib/calc/types';

	const sim = getSimulationState();

	let formState = $state<RawInputs>({
		propertyValue: 0,
		downPaymentPercent: 30,
		termMonths: 360,
		annualInterestRate: sim.bankPresets[0]?.annualRate || 10.49,
		grossMonthlyIncome: 0,
		netMonthlyIncome: 0,
		fgtsBalance: 0,
		coBorrowerIncome: 0,
		monthlyTR: 0
	});

	let selectedBankId = $state(sim.bankPresets[0]?.id || 'caixa');
	let showPresetManager = $state(false);

	// Format state for BRL display
	let propertyValueDisplay = $state('');
	let grossIncomeDisplay = $state('');
	let netIncomeDisplay = $state('');
	let fgtsDisplay = $state('');
	let coBorrowerDisplay = $state('');

	function formatOnBlur(field: keyof RawInputs, display: string) {
		const value = parseBRL(display);
		formState[field] = value as never;
		return value > 0 ? formatBRL(value) : '';
	}

	function selectBank(bankId: string) {
		selectedBankId = bankId;
		const preset = sim.bankPresets.find((p: BankPreset) => p.id === bankId);
		if (preset) {
			formState.annualInterestRate = preset.annualRate;
		}
	}

	function handleSimulate() {
		sim.simulate(formState);
	}

	// Get validation errors for a specific field
	function getError(field: string): string | null {
		if (!sim.hasSimulated) return null;
		if (!sim.validationResult.ok) {
			const err = sim.validationResult.errors.find((e) => e.field === field);
			return err?.message || null;
		}
		return null;
	}
</script>

<div class="space-y-6">
	<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
		<div class="space-y-2">
			<Label for="propertyValue">Valor do imóvel (R$)</Label>
			<Input
				id="propertyValue"
				type="text"
				placeholder="R$ 500.000,00"
				bind:value={propertyValueDisplay}
				onblur={() => { propertyValueDisplay = formatOnBlur('propertyValue', propertyValueDisplay); }}
				class={getError('propertyValue') ? 'border-red-500' : ''}
			/>
			{#if getError('propertyValue')}
				<p class="text-sm text-red-500">{getError('propertyValue')}</p>
			{/if}
		</div>

		<div class="space-y-2">
			<Label for="downPayment">Entrada (%)</Label>
			<Input
				id="downPayment"
				type="number"
				min="20"
				max="100"
				step="1"
				bind:value={formState.downPaymentPercent}
				class={getError('downPaymentPercent') ? 'border-red-500' : ''}
			/>
			{#if getError('downPaymentPercent')}
				<p class="text-sm text-red-500">{getError('downPaymentPercent')}</p>
			{/if}
		</div>

		<div class="space-y-2">
			<Label for="termMonths">Prazo (meses)</Label>
			<Input
				id="termMonths"
				type="number"
				min="1"
				max="420"
				bind:value={formState.termMonths}
				class={getError('termMonths') ? 'border-red-500' : ''}
			/>
			{#if getError('termMonths')}
				<p class="text-sm text-red-500">{getError('termMonths')}</p>
			{/if}
		</div>

		<div class="space-y-2">
			<div class="flex items-center gap-2">
				<Label for="annualRate">Taxa de juros anual (% a.a.)</Label>
			</div>
			<div class="flex gap-2">
				<select
					class="flex h-9 rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm dark:border-zinc-800"
					value={selectedBankId}
					onchange={(e) => selectBank((e.target as HTMLSelectElement).value)}
				>
					{#each sim.bankPresets as preset (preset.id)}
						<option value={preset.id}>{preset.name} ({preset.annualRate}%)</option>
					{/each}
				</select>
				<button
					class="h-9 w-9 inline-flex items-center justify-center rounded-md border border-zinc-200 text-sm hover:bg-zinc-100 dark:border-zinc-800 cursor-pointer"
					onclick={() => { showPresetManager = true; }}
					title="Gerenciar bancos"
				>⚙</button>
			</div>
			<Input
				id="annualRate"
				type="number"
				min="0.01"
				max="12"
				step="0.01"
				bind:value={formState.annualInterestRate}
				class={getError('annualInterestRate') ? 'border-red-500' : ''}
			/>
			{#if getError('annualInterestRate')}
				<p class="text-sm text-red-500">{getError('annualInterestRate')}</p>
			{/if}
		</div>

		<div class="space-y-2">
			<Label for="grossIncome">Renda bruta mensal (R$)</Label>
			<Input
				id="grossIncome"
				type="text"
				placeholder="R$ 15.000,00"
				bind:value={grossIncomeDisplay}
				onblur={() => { grossIncomeDisplay = formatOnBlur('grossMonthlyIncome', grossIncomeDisplay); }}
				class={getError('grossMonthlyIncome') ? 'border-red-500' : ''}
			/>
			{#if getError('grossMonthlyIncome')}
				<p class="text-sm text-red-500">{getError('grossMonthlyIncome')}</p>
			{/if}
		</div>

		<div class="space-y-2">
			<Label for="netIncome">Renda líquida mensal (R$)</Label>
			<Input
				id="netIncome"
				type="text"
				placeholder="R$ 12.000,00"
				bind:value={netIncomeDisplay}
				onblur={() => { netIncomeDisplay = formatOnBlur('netMonthlyIncome', netIncomeDisplay); }}
				class={getError('netMonthlyIncome') ? 'border-red-500' : ''}
			/>
			{#if getError('netMonthlyIncome')}
				<p class="text-sm text-red-500">{getError('netMonthlyIncome')}</p>
			{/if}
		</div>

		<div class="space-y-2">
			<Label for="fgts">Saldo FGTS (R$)</Label>
			<Input
				id="fgts"
				type="text"
				placeholder="R$ 0,00"
				bind:value={fgtsDisplay}
				onblur={() => { fgtsDisplay = formatOnBlur('fgtsBalance', fgtsDisplay); }}
			/>
			{#if getError('fgtsBalance')}
				<p class="text-sm text-red-500">{getError('fgtsBalance')}</p>
			{/if}
		</div>

		<div class="space-y-2">
			<Label for="coBorrower">Renda co-participante (R$)</Label>
			<Input
				id="coBorrower"
				type="text"
				placeholder="R$ 0,00"
				bind:value={coBorrowerDisplay}
				onblur={() => { coBorrowerDisplay = formatOnBlur('coBorrowerIncome', coBorrowerDisplay); }}
			/>
		</div>

		<div class="space-y-2">
			<Label for="tr">TR mensal estimada (% a.m.)</Label>
			<Input
				id="tr"
				type="number"
				min="0"
				max="1"
				step="0.01"
				bind:value={formState.monthlyTR}
			/>
		</div>
	</div>

	<Button onclick={handleSimulate} class="w-full md:w-auto">
		{#snippet children()}Simular{/snippet}
	</Button>

	{#if sim.incomeWarning}
		<Alert.Root variant="warning">
			<Alert.Title>{#snippet children()}Atenção{/snippet}</Alert.Title>
			<Alert.Description>{#snippet children()}{sim.incomeWarning}{/snippet}</Alert.Description>
		</Alert.Root>
	{/if}

	{#if sim.hasSimulated && !sim.validationResult.ok && sim.validationResult.errors.some((e) => e.field === 'fgtsBalance')}
		<Alert.Root variant="warning">
			<Alert.Title>{#snippet children()}FGTS{/snippet}</Alert.Title>
			<Alert.Description>{#snippet children()}FGTS não disponível para imóveis acima de R$ 1.500.000{/snippet}</Alert.Description>
		</Alert.Root>
	{/if}
</div>

{#if showPresetManager}
	<BankPresetManager bind:open={showPresetManager} />
{/if}
