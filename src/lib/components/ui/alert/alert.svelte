<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';
	import type { AlertVariant } from './index';

	interface Props { children?: Snippet; class?: string; variant?: AlertVariant }
	let { children, class: className, variant = 'default' }: Props = $props();

	const variantClasses: Record<AlertVariant, string> = {
		default: 'bg-white text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50',
		destructive: 'border-red-500/50 text-red-500 dark:border-red-500 [&>svg]:text-red-500',
		warning: 'border-amber-500/50 text-amber-700 bg-amber-50 dark:border-amber-500 dark:text-amber-400 dark:bg-amber-950/20'
	};
</script>

<div
	role="alert"
	class={cn('relative w-full rounded-lg border border-zinc-200 p-4 dark:border-zinc-800 [&>svg~*]:pl-7 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-zinc-950', variantClasses[variant], className)}
>
	{#if children}{@render children()}{/if}
</div>
