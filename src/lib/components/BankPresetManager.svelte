<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { getSimulationState } from '$lib/stores/simulation.svelte';
	import type { BankPreset } from '$lib/calc/types';

	interface Props {
		open: boolean;
	}

	let { open = $bindable() }: Props = $props();
	const sim = getSimulationState();

	let presets = $state<BankPreset[]>(sim.bankPresets.map((p: BankPreset) => ({ ...p })));
	let newName = $state('');
	let newRate = $state(0);

	function addPreset() {
		if (!newName.trim() || newRate <= 0) return;
		const id = newName.toLowerCase().replace(/\s+/g, '-');
		presets.push({
			id,
			name: newName.trim(),
			annualRate: newRate,
			referenceDate: 'Custom',
			isDefault: false
		});
		newName = '';
		newRate = 0;
	}

	function removePreset(id: string) {
		presets = presets.filter((p) => p.id !== id);
	}

	function save() {
		sim.updatePresets([...presets]);
		open = false;
	}

	function restore() {
		sim.resetPresets();
		presets = sim.bankPresets.map((p: BankPreset) => ({ ...p }));
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="fixed inset-0 z-50 flex items-center justify-center">
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div class="fixed inset-0 bg-black/50" onclick={() => { open = false; }}></div>
		<div class="relative z-50 w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
			<h2 class="text-lg font-semibold mb-4">Gerenciar Bancos</h2>

			<div class="space-y-3 max-h-64 overflow-y-auto">
				{#each presets as preset, i (preset.id)}
					<div class="flex items-center gap-2">
						<Input
							type="text"
							bind:value={presets[i].name}
							class="flex-1"
						/>
						<Input
							type="number"
							step="0.01"
							bind:value={presets[i].annualRate}
							class="w-24"
						/>
						<span class="text-sm text-zinc-500">%</span>
						<button
							class="text-red-500 hover:text-red-700 px-2 cursor-pointer"
							onclick={() => removePreset(preset.id)}
						>✕</button>
					</div>
				{/each}
			</div>

			<div class="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
				<Label>Adicionar banco</Label>
				<div class="flex items-center gap-2 mt-2">
					<Input type="text" placeholder="Nome do banco" bind:value={newName} class="flex-1" />
					<Input type="number" step="0.01" placeholder="Taxa" bind:value={newRate} class="w-24" />
					<span class="text-sm text-zinc-500">%</span>
					<Button size="sm" onclick={addPreset}>{#snippet children()}+{/snippet}</Button>
				</div>
			</div>

			<div class="mt-4 flex justify-between">
				<Button variant="outline" onclick={restore}>
					{#snippet children()}Restaurar padrões{/snippet}
				</Button>
				<div class="flex gap-2">
					<Button variant="outline" onclick={() => { open = false; }}>
						{#snippet children()}Cancelar{/snippet}
					</Button>
					<Button onclick={save}>
						{#snippet children()}Salvar{/snippet}
					</Button>
				</div>
			</div>
		</div>
	</div>
{/if}
