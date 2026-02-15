<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { getSimulationState } from '$lib/stores/simulation.svelte';
	import { formatBRL } from '$lib/calc/format';

	const sim = getSimulationState();
</script>

{#if sim.comparison}
	<div class="space-y-4">
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<Card.Root>
				<Card.Header>
					<Card.Title>{#snippet children()}SAC{/snippet}</Card.Title>
					<Card.Description>{#snippet children()}Sistema de Amortização Constante{/snippet}</Card.Description>
				</Card.Header>
				<Card.Content>
					{#snippet children()}
					<dl class="space-y-2 text-sm">
						<div class="flex justify-between">
							<dt class="text-zinc-500">Primeira parcela</dt>
							<dd class="font-medium">{formatBRL(sim.comparison!.sacTotals.firstPayment)}</dd>
						</div>
						<div class="flex justify-between">
							<dt class="text-zinc-500">Última parcela</dt>
							<dd class="font-medium">{formatBRL(sim.comparison!.sacTotals.lastPayment)}</dd>
						</div>
						<div class="flex justify-between">
							<dt class="text-zinc-500">Total de juros</dt>
							<dd class="font-medium">{formatBRL(sim.comparison!.sacTotals.totalInterest)}</dd>
						</div>
						<div class="flex justify-between">
							<dt class="text-zinc-500">Total pago</dt>
							<dd class="font-semibold">{formatBRL(sim.comparison!.sacTotals.totalPayment)}</dd>
						</div>
					</dl>
					{/snippet}
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header>
					<Card.Title>{#snippet children()}Price{/snippet}</Card.Title>
					<Card.Description>{#snippet children()}Tabela Price (parcelas fixas){/snippet}</Card.Description>
				</Card.Header>
				<Card.Content>
					{#snippet children()}
					<dl class="space-y-2 text-sm">
						<div class="flex justify-between">
							<dt class="text-zinc-500">Primeira parcela</dt>
							<dd class="font-medium">{formatBRL(sim.comparison!.priceTotals.firstPayment)}</dd>
						</div>
						<div class="flex justify-between">
							<dt class="text-zinc-500">Última parcela</dt>
							<dd class="font-medium">{formatBRL(sim.comparison!.priceTotals.lastPayment)}</dd>
						</div>
						<div class="flex justify-between">
							<dt class="text-zinc-500">Total de juros</dt>
							<dd class="font-medium">{formatBRL(sim.comparison!.priceTotals.totalInterest)}</dd>
						</div>
						<div class="flex justify-between">
							<dt class="text-zinc-500">Total pago</dt>
							<dd class="font-semibold">{formatBRL(sim.comparison!.priceTotals.totalPayment)}</dd>
						</div>
					</dl>
					{/snippet}
				</Card.Content>
			</Card.Root>
		</div>

		<div class="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-center dark:bg-emerald-950/20 dark:border-emerald-800">
			<p class="text-sm text-emerald-700 dark:text-emerald-400">
				Economia SAC vs Price: <strong class="text-lg">{formatBRL(sim.comparison.interestSaved)}</strong> em juros
			</p>
		</div>
	</div>
{/if}
