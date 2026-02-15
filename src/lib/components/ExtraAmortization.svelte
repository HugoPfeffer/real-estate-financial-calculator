<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Card from '$lib/components/ui/card';
	import { getSimulationState } from '$lib/stores/simulation.svelte';
	import { formatBRL } from '$lib/calc/format';
	import type { ExtraPayment } from '$lib/calc/types';

	const sim = getSimulationState();

	let entries = $state<ExtraPayment[]>([]);
	let fgtsError = $state<string | null>(null);

	function addEntry() {
		entries = [...entries, {
			type: 'pontual',
			amount: 0,
			month: 24,
			modality: 'prazo',
			isFgts: false
		}];
	}

	function removeEntry(index: number) {
		entries = entries.filter((_, i) => i !== index);
	}

	function handleSimulate() {
		sim.extraPayments = [...entries];
		const err = sim.validateFgts();
		if (err) {
			fgtsError = err;
			return;
		}
		fgtsError = null;
		sim.simulateExtra();
	}

	function toSvgPath(points: { x: number; y: number }[]): string {
		if (points.length === 0) return '';
		return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
	}
</script>

{#if sim.sacSchedule || sim.priceSchedule}
	<div class="space-y-4">
		<div class="flex items-center gap-4 mb-4">
			<Label>Sistema base:</Label>
			<select
				class="flex h-9 rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm dark:border-zinc-800"
				value={sim.extraBaseSystem}
				onchange={(e) => { sim.extraBaseSystem = (e.target as HTMLSelectElement).value as 'sac' | 'price'; }}
			>
				<option value="sac">SAC</option>
				<option value="price">Price</option>
			</select>
		</div>

		<div class="space-y-3">
			{#each entries as entry, i (i)}
				<div class="p-4 border border-zinc-200 rounded-lg dark:border-zinc-800 space-y-3">
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium">Pagamento extra #{i + 1}</span>
						<button class="text-red-500 hover:text-red-700 text-sm cursor-pointer" onclick={() => removeEntry(i)}>Remover</button>
					</div>
					<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
						<div class="space-y-1">
							<Label>Tipo</Label>
							<select
								class="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm dark:border-zinc-800"
								bind:value={entries[i].type}
							>
								<option value="pontual">Pontual</option>
								<option value="recorrente">Recorrente</option>
							</select>
						</div>
						<div class="space-y-1">
							<Label>Valor (R$)</Label>
							<Input type="number" min="0" step="1000" bind:value={entries[i].amount} />
						</div>
						<div class="space-y-1">
							<Label>{entry.type === 'pontual' ? 'Mês' : 'A partir do mês'}</Label>
							<Input type="number" min="1" bind:value={entries[i].month} />
						</div>
						<div class="space-y-1">
							<Label>Modalidade</Label>
							<select
								class="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm dark:border-zinc-800"
								bind:value={entries[i].modality}
							>
								<option value="prazo">Redução de prazo</option>
								<option value="parcela">Redução de parcela</option>
							</select>
						</div>
					</div>
					<label class="flex items-center gap-2 text-sm">
						<input type="checkbox" bind:checked={entries[i].isFgts} class="rounded" />
						FGTS
					</label>
				</div>
			{/each}
		</div>

		<div class="flex gap-2">
			<Button variant="outline" onclick={addEntry}>
				{#snippet children()}+ Adicionar pagamento extra{/snippet}
			</Button>
			{#if entries.length > 0}
				<Button onclick={handleSimulate}>
					{#snippet children()}Simular{/snippet}
				</Button>
			{/if}
		</div>

		{#if fgtsError}
			<p class="text-sm text-red-500">{fgtsError}</p>
		{/if}

		{#if sim.extraAmortResult}
			{@const result = sim.extraAmortResult}
			{@const baseSchedule = sim.extraBaseSystem === 'sac' ? sim.sacSchedule : sim.priceSchedule}

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
				<Card.Root>
					<Card.Header>
						<Card.Title>{#snippet children()}Sem amortização extra{/snippet}</Card.Title>
					</Card.Header>
					<Card.Content>
						{#snippet children()}
						<dl class="space-y-2 text-sm">
							<div class="flex justify-between">
								<dt class="text-zinc-500">Prazo</dt>
								<dd class="font-medium">{baseSchedule?.periods.length} meses</dd>
							</div>
							<div class="flex justify-between">
								<dt class="text-zinc-500">Total de juros</dt>
								<dd class="font-medium">{formatBRL(baseSchedule?.totals.totalInterest || 0)}</dd>
							</div>
							<div class="flex justify-between">
								<dt class="text-zinc-500">Total pago</dt>
								<dd class="font-semibold">{formatBRL(baseSchedule?.totals.totalPayment || 0)}</dd>
							</div>
						</dl>
						{/snippet}
					</Card.Content>
				</Card.Root>

				<Card.Root>
					<Card.Header>
						<Card.Title>{#snippet children()}Com amortização extra{/snippet}</Card.Title>
					</Card.Header>
					<Card.Content>
						{#snippet children()}
						<dl class="space-y-2 text-sm">
							<div class="flex justify-between">
								<dt class="text-zinc-500">Prazo</dt>
								<dd class="font-medium">{result.modified.periods.length} meses</dd>
							</div>
							<div class="flex justify-between">
								<dt class="text-zinc-500">Total de juros</dt>
								<dd class="font-medium">{formatBRL(result.modified.totals.totalInterest)}</dd>
							</div>
							<div class="flex justify-between">
								<dt class="text-zinc-500">Total pago</dt>
								<dd class="font-semibold">{formatBRL(result.modified.totals.totalPayment)}</dd>
							</div>
						</dl>
						{/snippet}
					</Card.Content>
				</Card.Root>
			</div>

			<div class="rounded-lg bg-emerald-50 border border-emerald-200 p-4 dark:bg-emerald-950/20 dark:border-emerald-800">
				<div class="grid grid-cols-3 gap-4 text-center">
					<div>
						<p class="text-xs text-emerald-600 dark:text-emerald-400">Juros economizados</p>
						<p class="text-lg font-semibold text-emerald-700 dark:text-emerald-300">{formatBRL(result.savings.interestSaved)}</p>
					</div>
					<div>
						<p class="text-xs text-emerald-600 dark:text-emerald-400">Meses a menos</p>
						<p class="text-lg font-semibold text-emerald-700 dark:text-emerald-300">{result.savings.termReduction}</p>
					</div>
					<div>
						<p class="text-xs text-emerald-600 dark:text-emerald-400">Economia total</p>
						<p class="text-lg font-semibold text-emerald-700 dark:text-emerald-300">{formatBRL(result.savings.totalSaved)}</p>
					</div>
				</div>
			</div>

			<!-- Balance comparison chart -->
			{#if baseSchedule}
				{@const origPeriods = baseSchedule.periods}
				{@const modPeriods = result.modified.periods}
				{@const maxLen = Math.max(origPeriods.length, modPeriods.length)}
				{@const maxBal = origPeriods[0].balance + origPeriods[0].amortization}
				{@const step = Math.max(1, Math.floor(maxLen / 60))}
				{@const chartW = 600}
				{@const chartH = 180}
				{@const pad = 40}

				<div>
					<h4 class="text-sm font-medium mb-2">Saldo Devedor: Original vs Modificado</h4>
					<svg viewBox="0 0 {chartW + pad * 2} {chartH + pad * 2}" class="w-full border rounded-lg bg-white dark:bg-zinc-950">
						<line x1={pad} y1={chartH + pad} x2={chartW + pad} y2={chartH + pad} stroke="currentColor" stroke-opacity="0.2" />

						<!-- Original (gray dashed) -->
						<path
							d={toSvgPath(
								Array.from({ length: Math.ceil(origPeriods.length / step) }, (_, idx) => {
									const i = Math.min(idx * step, origPeriods.length - 1);
									return {
										x: pad + (i / (maxLen - 1)) * chartW,
										y: chartH + pad - (origPeriods[i].balance / maxBal) * chartH
									};
								})
							)}
							fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4"
						/>

						<!-- Modified (emerald) -->
						<path
							d={toSvgPath(
								Array.from({ length: Math.ceil(modPeriods.length / step) }, (_, idx) => {
									const i = Math.min(idx * step, modPeriods.length - 1);
									return {
										x: pad + (i / (maxLen - 1)) * chartW,
										y: chartH + pad - (modPeriods[i].balance / maxBal) * chartH
									};
								})
							)}
							fill="none" stroke="#10b981" stroke-width="2"
						/>

						<rect x={chartW + pad - 130} y={pad + 5} width="10" height="3" fill="#94a3b8" />
						<text x={chartW + pad - 115} y={pad + 10} font-size="9" fill="currentColor">Original</text>
						<rect x={chartW + pad - 65} y={pad + 5} width="10" height="3" fill="#10b981" />
						<text x={chartW + pad - 50} y={pad + 10} font-size="9" fill="currentColor">Modificado</text>
					</svg>
				</div>
			{/if}
		{/if}
	</div>
{/if}
