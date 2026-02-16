<script lang="ts">
	import { getSimulationState } from '$lib/stores/simulation.svelte';
	import { formatBRL } from '$lib/calc/format';
	import type { Period } from '$lib/calc/types';

	const sim = getSimulationState();

	let periods = $derived<Period[]>(
		sim.activeTab === 'sac'
			? sim.sacSchedule?.periods || []
			: sim.priceSchedule?.periods || []
	);

	// Simple windowed rendering: only render visible rows + buffer
	let scrollTop = $state(0);
	const ROW_HEIGHT = 40;
	const VISIBLE_HEIGHT = 400;
	const OVERSCAN = 10;

	let startIndex = $derived(Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN));
	let endIndex = $derived(Math.min(periods.length, Math.ceil((scrollTop + VISIBLE_HEIGHT) / ROW_HEIGHT) + OVERSCAN));
	let visiblePeriods = $derived(periods.slice(startIndex, endIndex));

	function isChecked(month: number): boolean {
		return month <= sim.paidUpToMonth || sim.extraPaidMonths.has(month);
	}

	function isDisabled(month: number): boolean {
		return month < sim.paidUpToMonth;
	}

	function isSequential(month: number): boolean {
		return month <= sim.paidUpToMonth;
	}

	function isExtra(month: number): boolean {
		return sim.extraPaidMonths.has(month);
	}

	function extraPrincipalTotal(): number {
		const baseSchedule = sim.activeTab === 'sac' ? sim.sacSchedule : sim.priceSchedule;
		if (!baseSchedule) return 0;
		let total = 0;
		for (const m of sim.extraPaidMonths) {
			total += baseSchedule.periods[m - 1].amortization;
		}
		return Math.round(total * 100) / 100;
	}

	let balanceOverflowWarning = $state(false);

	function handleToggle(month: number) {
		const checked = isChecked(month);
		if (!checked && !sim.canCheck(month)) {
			balanceOverflowWarning = true;
			setTimeout(() => { balanceOverflowWarning = false; }, 3000);
			return;
		}
		sim.toggleMonth(month);
	}
</script>

{#if sim.sacSchedule && sim.priceSchedule}
	<div>
		<div class="flex flex-wrap items-center gap-3 mb-4">
			<div class="flex gap-2">
				<button
					class="px-4 py-2 text-sm rounded-md border cursor-pointer {sim.activeTab === 'sac' ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900' : 'border-zinc-200 dark:border-zinc-800'}"
					onclick={() => { sim.activeTab = 'sac'; }}
				>SAC</button>
				<button
					class="px-4 py-2 text-sm rounded-md border cursor-pointer {sim.activeTab === 'price' ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900' : 'border-zinc-200 dark:border-zinc-800'}"
					onclick={() => { sim.activeTab = 'price'; }}
				>Price</button>
			</div>

			<div class="flex items-center gap-2 ml-auto">
				<label class="text-sm text-zinc-500 dark:text-zinc-400" for="planning-toggle">Modo planejamento</label>
				<button
					id="planning-toggle"
					role="switch"
					aria-checked={sim.planningMode}
					aria-label="Modo planejamento"
					class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer {sim.planningMode ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'}"
					onclick={() => { sim.planningMode = !sim.planningMode; }}
				>
					<span
						class="inline-block h-4 w-4 rounded-full bg-white transition-transform {sim.planningMode ? 'translate-x-6' : 'translate-x-1'}"
					></span>
				</button>
			</div>

			{#if sim.planningMode}
				<div class="flex items-center gap-2">
					<label class="text-sm text-zinc-500 dark:text-zinc-400" for="modality-select">Modalidade</label>
					<select
						id="modality-select"
						class="h-8 rounded-md border border-zinc-200 bg-transparent px-2 text-sm dark:border-zinc-800"
						value={sim.extraModality}
						onchange={(e) => { sim.extraModality = (e.target as HTMLSelectElement).value as 'prazo' | 'parcela'; }}
					>
						<option value="prazo">Redução de prazo</option>
						<option value="parcela">Redução de parcela</option>
					</select>
				</div>
			{/if}
		</div>

		<div class="border border-zinc-200 rounded-lg dark:border-zinc-800 overflow-hidden">
			<table class="w-full text-sm">
				<thead class="sticky top-0 z-10 bg-zinc-50 dark:bg-zinc-900">
					<tr class="border-b border-zinc-200 dark:border-zinc-800">
						{#if sim.planningMode}
							<th class="px-2 py-2 w-10"></th>
						{/if}
						<th class="px-3 py-2 text-left font-medium text-zinc-500 w-16">Mês</th>
						<th class="px-3 py-2 text-right font-medium text-zinc-500">Parcela (R$)</th>
						<th class="px-3 py-2 text-right font-medium text-zinc-500">Amortização (R$)</th>
						<th class="px-3 py-2 text-right font-medium text-zinc-500">Juros (R$)</th>
						<th class="px-3 py-2 text-right font-medium text-zinc-500">Saldo Devedor (R$)</th>
					</tr>
				</thead>
			</table>

			<div
				class="overflow-auto"
				style="height: {Math.min(periods.length * ROW_HEIGHT, VISIBLE_HEIGHT)}px;"
				onscroll={(e) => { scrollTop = (e.target as HTMLElement).scrollTop; }}
			>
				<div style="height: {periods.length * ROW_HEIGHT}px; position: relative;">
					{#each visiblePeriods as period (period.month)}
						<div
							class="absolute w-full flex border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
							style="height: {ROW_HEIGHT}px; top: {(period.month - 1) * ROW_HEIGHT}px;"
						>
							{#if sim.planningMode}
								<div class="px-2 flex items-center w-10 justify-center">
									<button
										class="flex items-center justify-center w-5 h-5 rounded border cursor-pointer
											{isChecked(period.month)
												? 'bg-emerald-500 border-emerald-500 text-white'
												: 'border-zinc-300 dark:border-zinc-600'}
											{isDisabled(period.month) ? 'opacity-50 cursor-not-allowed' : ''}"
										disabled={isDisabled(period.month)}
										onclick={() => handleToggle(period.month)}
										aria-label="Marcar mês {period.month}"
									>
										{#if isChecked(period.month)}
											<span class="text-xs">{isSequential(period.month) ? '▪' : '★'}</span>
										{/if}
									</button>
								</div>
							{/if}
							<div class="px-3 flex items-center w-16 text-zinc-500">{period.month}</div>
							<div class="px-3 flex items-center justify-end flex-1">{formatBRL(period.payment)}</div>
							<div class="px-3 flex items-center justify-end flex-1">{formatBRL(period.amortization)}</div>
							<div class="px-3 flex items-center justify-end flex-1">{formatBRL(period.interest)}</div>
							<div class="px-3 flex items-center justify-end flex-1">{formatBRL(period.balance)}</div>
						</div>
					{/each}
				</div>
			</div>
		</div>

		{#if sim.planningMode}
			<!-- Status bar -->
			<div class="mt-3 px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800/50 text-sm text-zinc-600 dark:text-zinc-400">
				{#if sim.extraPaidMonths.size > 0}
					Parcelas pagas: {sim.paidUpToMonth} | Extras: {sim.extraPaidMonths.size}
					(mês {[...sim.extraPaidMonths].sort((a, b) => a - b).join(', ')})
					| Amortização extra total: {formatBRL(extraPrincipalTotal())}
				{:else}
					Parcelas pagas: {sim.paidUpToMonth} | Nenhuma amortização extra
				{/if}
			</div>

			{#if balanceOverflowWarning}
				<div class="mt-2 px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600 dark:bg-red-950/20 dark:border-red-800 dark:text-red-400">
					Saldo insuficiente para mais amortizações extras.
				</div>
			{/if}

			<!-- Comparison section -->
			{#if sim.planningResult}
				{@const result = sim.planningResult}
				{@const baseSchedule = sim.activeTab === 'sac' ? sim.sacSchedule : sim.priceSchedule}

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
					<div class="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
						<h4 class="text-sm font-semibold mb-3">Sem amortização extra</h4>
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
					</div>

					<div class="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
						<h4 class="text-sm font-semibold mb-3">Com amortização extra</h4>
						<dl class="space-y-2 text-sm">
							<div class="flex justify-between">
								<dt class="text-zinc-500">Prazo</dt>
								<dd class="font-medium">{sim.paidUpToMonth + result.modified.periods.length} meses</dd>
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
					</div>
				</div>

				<div class="rounded-lg bg-emerald-50 border border-emerald-200 p-4 mt-4 dark:bg-emerald-950/20 dark:border-emerald-800">
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
					{@const origNumPts = Math.ceil(origPeriods.length / step)}
					{@const modNumPts = modPeriods.length > 0 ? Math.ceil(modPeriods.length / step) : 0}

					<div class="mt-4">
						<h4 class="text-sm font-medium mb-2">Saldo Devedor: Original vs Modificado</h4>
						<svg viewBox="0 0 {chartW + pad * 2} {chartH + pad * 2}" class="w-full border rounded-lg bg-white dark:bg-zinc-950">
							<line x1={pad} y1={chartH + pad} x2={chartW + pad} y2={chartH + pad} stroke="currentColor" stroke-opacity="0.2" />

							<!-- Original (gray dashed) -->
							<path
								d={Array.from({ length: origNumPts }, (_, idx) => {
									const pi = idx === origNumPts - 1 ? origPeriods.length - 1 : idx * step;
									const x = pad + (pi / (maxLen - 1)) * chartW;
									const y = chartH + pad - (origPeriods[pi].balance / maxBal) * chartH;
									return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
								}).join(' ')}
								fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4"
							/>

							<!-- Modified (emerald) -->
							{#if modNumPts > 0}
								<path
									d={Array.from({ length: modNumPts }, (_, idx) => {
										const pi = idx === modNumPts - 1 ? modPeriods.length - 1 : idx * step;
										const x = pad + (pi / (maxLen - 1)) * chartW;
										const y = chartH + pad - (modPeriods[pi].balance / maxBal) * chartH;
										return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
									}).join(' ')}
									fill="none" stroke="#10b981" stroke-width="2"
								/>
							{/if}

							<rect x={chartW + pad - 130} y={pad + 5} width="10" height="3" fill="#94a3b8" />
							<text x={chartW + pad - 115} y={pad + 10} font-size="9" fill="currentColor">Original</text>
							<rect x={chartW + pad - 65} y={pad + 5} width="10" height="3" fill="#10b981" />
							<text x={chartW + pad - 50} y={pad + 10} font-size="9" fill="currentColor">Modificado</text>
						</svg>
					</div>
				{/if}
			{/if}
		{/if}
	</div>
{/if}
