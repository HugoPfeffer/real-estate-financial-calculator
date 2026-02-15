<script lang="ts">
	import { getSimulationState } from '$lib/stores/simulation.svelte';
	import { formatBRL } from '$lib/calc/format';

	const sim = getSimulationState();

	let activeComposition = $state<'sac' | 'price'>('sac');

	function getChartData() {
		if (!sim.sacSchedule || !sim.priceSchedule) return null;

		const sac = sim.sacSchedule.periods;
		const price = sim.priceSchedule.periods;

		// Downsample for charts if more than 60 data points
		const step = Math.max(1, Math.floor(sac.length / 60));
		const indices: number[] = [];
		for (let i = 0; i < sac.length; i += step) indices.push(i);
		if (indices[indices.length - 1] !== sac.length - 1) indices.push(sac.length - 1);

		return {
			indices,
			sac: indices.map((i) => sac[i]),
			price: indices.map((i) => price[i])
		};
	}

	function getMaxPayment() {
		const data = getChartData();
		if (!data) return 0;
		return Math.max(
			...data.sac.map((p) => p.payment),
			...data.price.map((p) => p.payment)
		);
	}

	function getMaxBalance() {
		const data = getChartData();
		if (!data) return 0;
		return Math.max(data.sac[0].balance + data.sac[0].amortization, data.price[0].balance + data.price[0].amortization);
	}

	function toSvgPath(points: { x: number; y: number }[]): string {
		if (points.length === 0) return '';
		return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
	}

	function toSvgArea(points: { x: number; y: number }[], baseline: number): string {
		if (points.length === 0) return '';
		const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
		return `${path} L ${points[points.length - 1].x} ${baseline} L ${points[0].x} ${baseline} Z`;
	}

	let tooltipData = $state<{ x: number; sacPayment: number; pricePayment: number; month: number } | null>(null);
</script>

{#if sim.sacSchedule && sim.priceSchedule}
	{@const data = getChartData()}
	{@const maxPay = getMaxPayment()}
	{@const maxBal = getMaxBalance()}
	{@const chartW = 600}
	{@const chartH = 200}
	{@const pad = 40}

	<div class="space-y-8">
		<!-- Chart 1: Payment Evolution -->
		<div>
			<h3 class="text-sm font-medium mb-2">Evolução das Parcelas</h3>
			{#if data}
				<svg viewBox="0 0 {chartW + pad * 2} {chartH + pad * 2}" class="w-full border rounded-lg bg-white dark:bg-zinc-950">
					<!-- Axes -->
					<line x1={pad} y1={chartH + pad} x2={chartW + pad} y2={chartH + pad} stroke="currentColor" stroke-opacity="0.2" />
					<line x1={pad} y1={pad} x2={pad} y2={chartH + pad} stroke="currentColor" stroke-opacity="0.2" />

					<!-- Y axis labels -->
					{#each [0, 0.25, 0.5, 0.75, 1] as frac}
						<text x={pad - 4} y={chartH + pad - frac * chartH} text-anchor="end" font-size="8" fill="currentColor" opacity="0.5" dominant-baseline="middle">
							{formatBRL(frac * maxPay)}
						</text>
						<line x1={pad} y1={chartH + pad - frac * chartH} x2={chartW + pad} y2={chartH + pad - frac * chartH} stroke="currentColor" stroke-opacity="0.05" />
					{/each}

					<!-- SAC line (blue) -->
					<path
						d={toSvgPath(data.sac.map((p, i) => ({
							x: pad + (i / (data.indices.length - 1)) * chartW,
							y: chartH + pad - (p.payment / maxPay) * chartH
						})))}
						fill="none" stroke="#3b82f6" stroke-width="2"
					/>

					<!-- Price line (green) -->
					<path
						d={toSvgPath(data.price.map((p, i) => ({
							x: pad + (i / (data.indices.length - 1)) * chartW,
							y: chartH + pad - (p.payment / maxPay) * chartH
						})))}
						fill="none" stroke="#22c55e" stroke-width="2"
					/>

					<!-- Legend -->
					<rect x={chartW + pad - 110} y={pad + 5} width="10" height="3" fill="#3b82f6" />
					<text x={chartW + pad - 95} y={pad + 10} font-size="9" fill="currentColor">SAC</text>
					<rect x={chartW + pad - 60} y={pad + 5} width="10" height="3" fill="#22c55e" />
					<text x={chartW + pad - 45} y={pad + 10} font-size="9" fill="currentColor">Price</text>
				</svg>
			{/if}
		</div>

		<!-- Chart 2: Payment Composition -->
		<div>
			<h3 class="text-sm font-medium mb-2">Composição da Parcela</h3>
			<div class="flex gap-2 mb-2">
				<button
					class="px-3 py-1 text-xs rounded-md border cursor-pointer {activeComposition === 'sac' ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900' : 'border-zinc-200 dark:border-zinc-800'}"
					onclick={() => { activeComposition = 'sac'; }}
				>SAC</button>
				<button
					class="px-3 py-1 text-xs rounded-md border cursor-pointer {activeComposition === 'price' ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900' : 'border-zinc-200 dark:border-zinc-800'}"
					onclick={() => { activeComposition = 'price'; }}
				>Price</button>
			</div>
			{#if data}
				{@const composData = activeComposition === 'sac' ? data.sac : data.price}
				{@const maxComp = Math.max(...composData.map((p) => p.payment))}
				<svg viewBox="0 0 {chartW + pad * 2} {chartH + pad * 2}" class="w-full border rounded-lg bg-white dark:bg-zinc-950">
					<line x1={pad} y1={chartH + pad} x2={chartW + pad} y2={chartH + pad} stroke="currentColor" stroke-opacity="0.2" />

					<!-- Interest area (red) -->
					<path
						d={toSvgArea(composData.map((p, i) => ({
							x: pad + (i / (data.indices.length - 1)) * chartW,
							y: chartH + pad - (p.payment / maxComp) * chartH
						})), chartH + pad)}
						fill="#ef444433" stroke="none"
					/>

					<!-- Amortization area (blue) - from bottom to amortization height -->
					<path
						d={toSvgArea(composData.map((p, i) => ({
							x: pad + (i / (data.indices.length - 1)) * chartW,
							y: chartH + pad - (p.amortization / maxComp) * chartH
						})), chartH + pad)}
						fill="#3b82f633" stroke="none"
					/>

					<!-- Lines -->
					<path
						d={toSvgPath(composData.map((p, i) => ({
							x: pad + (i / (data.indices.length - 1)) * chartW,
							y: chartH + pad - (p.amortization / maxComp) * chartH
						})))}
						fill="none" stroke="#3b82f6" stroke-width="1.5"
					/>
					<path
						d={toSvgPath(composData.map((p, i) => ({
							x: pad + (i / (data.indices.length - 1)) * chartW,
							y: chartH + pad - (p.payment / maxComp) * chartH
						})))}
						fill="none" stroke="#ef4444" stroke-width="1.5"
					/>

					<!-- Legend -->
					<rect x={chartW + pad - 140} y={pad + 5} width="10" height="3" fill="#3b82f6" />
					<text x={chartW + pad - 125} y={pad + 10} font-size="9" fill="currentColor">Amortização</text>
					<rect x={chartW + pad - 60} y={pad + 5} width="10" height="3" fill="#ef4444" />
					<text x={chartW + pad - 45} y={pad + 10} font-size="9" fill="currentColor">Juros</text>
				</svg>
			{/if}
		</div>

		<!-- Chart 3: Balance -->
		<div>
			<h3 class="text-sm font-medium mb-2">Saldo Devedor</h3>
			{#if data}
				<svg viewBox="0 0 {chartW + pad * 2} {chartH + pad * 2}" class="w-full border rounded-lg bg-white dark:bg-zinc-950">
					<line x1={pad} y1={chartH + pad} x2={chartW + pad} y2={chartH + pad} stroke="currentColor" stroke-opacity="0.2" />
					<line x1={pad} y1={pad} x2={pad} y2={chartH + pad} stroke="currentColor" stroke-opacity="0.2" />

					{#each [0, 0.25, 0.5, 0.75, 1] as frac}
						<text x={pad - 4} y={chartH + pad - frac * chartH} text-anchor="end" font-size="8" fill="currentColor" opacity="0.5" dominant-baseline="middle">
							{formatBRL(frac * maxBal)}
						</text>
					{/each}

					<!-- SAC balance (blue, linear) -->
					<path
						d={toSvgPath(data.sac.map((p, i) => ({
							x: pad + (i / (data.indices.length - 1)) * chartW,
							y: chartH + pad - (p.balance / maxBal) * chartH
						})))}
						fill="none" stroke="#3b82f6" stroke-width="2"
					/>

					<!-- Price balance (green, concave) -->
					<path
						d={toSvgPath(data.price.map((p, i) => ({
							x: pad + (i / (data.indices.length - 1)) * chartW,
							y: chartH + pad - (p.balance / maxBal) * chartH
						})))}
						fill="none" stroke="#22c55e" stroke-width="2"
					/>

					<rect x={chartW + pad - 110} y={pad + 5} width="10" height="3" fill="#3b82f6" />
					<text x={chartW + pad - 95} y={pad + 10} font-size="9" fill="currentColor">SAC</text>
					<rect x={chartW + pad - 60} y={pad + 5} width="10" height="3" fill="#22c55e" />
					<text x={chartW + pad - 45} y={pad + 10} font-size="9" fill="currentColor">Price</text>
				</svg>
			{/if}
		</div>
	</div>
{/if}
