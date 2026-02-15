<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	interface Props { children?: Snippet; class?: string }
	let { children, class: className }: Props = $props();
</script>

<tbody class={cn('[&_tr:last-child]:border-0', className)}>
	{#if children}{@render children()}{/if}
</tbody>
