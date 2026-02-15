<script lang="ts">
	import InputForm from '$lib/components/InputForm.svelte';
	import SummaryCards from '$lib/components/SummaryCards.svelte';
	import ComparisonCharts from '$lib/components/ComparisonCharts.svelte';
	import ScheduleTable from '$lib/components/ScheduleTable.svelte';
	import ExtraAmortization from '$lib/components/ExtraAmortization.svelte';
	import { getSimulationState } from '$lib/stores/simulation.svelte';

	const sim = getSimulationState();
</script>

<svelte:head>
	<title>Simulador de Financiamento Imobiliário</title>
	<meta name="description" content="Compare SAC vs Price - simulação de financiamento imobiliário brasileiro" />
</svelte:head>

<div class="max-w-5xl mx-auto px-4 py-8">
	<!-- Header -->
	<header class="text-center mb-8">
		<h1 class="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
			Simulador de Financiamento Imobiliário
		</h1>
		<p class="text-sm text-zinc-500 mt-1">Compare SAC vs Price e simule amortizações extraordinárias</p>
	</header>

	<!-- Input Form -->
	<section class="mb-8">
		<h2 class="text-lg font-semibold mb-4">Dados do Financiamento</h2>
		<InputForm />
	</section>

	<!-- Results (only shown after simulation) -->
	{#if sim.hasSimulated && sim.sacSchedule && sim.priceSchedule}
		<!-- Summary Cards -->
		<section class="mb-8">
			<h2 class="text-lg font-semibold mb-4">Resumo Comparativo</h2>
			<SummaryCards />
		</section>

		<!-- Charts -->
		<section class="mb-8">
			<h2 class="text-lg font-semibold mb-4">Gráficos</h2>
			<ComparisonCharts />
		</section>

		<!-- Schedule Table -->
		<section class="mb-8">
			<h2 class="text-lg font-semibold mb-4">Tabela de Amortização</h2>
			<ScheduleTable />
		</section>

		<!-- Extraordinary Amortization -->
		<section class="mb-8">
			<h2 class="text-lg font-semibold mb-4">Amortização Extraordinária</h2>
			<p class="text-sm text-zinc-500 mb-4">Antecipação de pagamento é livre de multas no Brasil (Lei 8.692/93).</p>
			<ExtraAmortization />
		</section>
	{/if}

	<!-- Footer -->
	<footer class="mt-12 pt-6 border-t border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-400">
		<p>Simulação meramente ilustrativa. Valores podem diferir das condições reais oferecidas pelos bancos.</p>
		<p class="mt-1">Taxas de referência: Fev 2026.</p>
	</footer>
</div>
