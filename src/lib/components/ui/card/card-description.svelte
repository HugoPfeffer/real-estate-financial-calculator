<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	interface Props { children?: Snippet; class?: string }
	let { children, class: className }: Props = $props();
</script>

<p class={cn('text-sm text-zinc-500 dark:text-zinc-400', className)}>
	{#if children}{@render children()}{/if}
</p>
