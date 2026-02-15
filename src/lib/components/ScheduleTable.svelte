<script lang="ts">
	import { getSimulationState } from '$lib/stores/simulation.svelte';
	import { formatBRL } from '$lib/calc/format';
	import type { Period } from '$lib/calc/types';

	const sim = getSimulationState();

	let activeTab = $state<'sac' | 'price'>('sac');

	let periods = $derived<Period[]>(
		activeTab === 'sac'
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
</script>

{#if sim.sacSchedule && sim.priceSchedule}
	<div>
		<div class="flex gap-2 mb-4">
			<button
				class="px-4 py-2 text-sm rounded-md border cursor-pointer {activeTab === 'sac' ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900' : 'border-zinc-200 dark:border-zinc-800'}"
				onclick={() => { activeTab = 'sac'; }}
			>SAC</button>
			<button
				class="px-4 py-2 text-sm rounded-md border cursor-pointer {activeTab === 'price' ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900' : 'border-zinc-200 dark:border-zinc-800'}"
				onclick={() => { activeTab = 'price'; }}
			>Price</button>
		</div>

		<div class="border border-zinc-200 rounded-lg dark:border-zinc-800 overflow-hidden">
			<table class="w-full text-sm">
				<thead class="sticky top-0 z-10 bg-zinc-50 dark:bg-zinc-900">
					<tr class="border-b border-zinc-200 dark:border-zinc-800">
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
	</div>
{/if}
