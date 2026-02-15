<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	interface Props { children?: Snippet; class?: string }
	let { children, class: className }: Props = $props();
</script>

<thead class={cn('[&_tr]:border-b', className)}>
	{#if children}{@render children()}{/if}
</thead>
