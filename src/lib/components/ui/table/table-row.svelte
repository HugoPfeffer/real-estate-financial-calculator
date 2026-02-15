<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	interface Props { children?: Snippet; class?: string }
	let { children, class: className }: Props = $props();
</script>

<tr class={cn('border-b border-zinc-200 transition-colors hover:bg-zinc-100/50 dark:border-zinc-800 dark:hover:bg-zinc-800/50', className)}>
	{#if children}{@render children()}{/if}
</tr>
