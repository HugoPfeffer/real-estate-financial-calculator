<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	interface Props { children?: Snippet; class?: string }
	let { children, class: className }: Props = $props();
</script>

<th class={cn('h-10 px-2 text-left align-middle font-medium text-zinc-500 dark:text-zinc-400 [&:has([role=checkbox])]:pr-0', className)}>
	{#if children}{@render children()}{/if}
</th>
