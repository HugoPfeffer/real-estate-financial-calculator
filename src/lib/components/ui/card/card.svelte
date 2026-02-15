<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		children?: Snippet;
		class?: string;
	}

	let { children, class: className, ...restProps }: Props = $props();
</script>

<div class={cn('rounded-xl border border-zinc-200 bg-white text-zinc-950 shadow dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50', className)} {...restProps}>
	{#if children}{@render children()}{/if}
</div>
