<script lang="ts">
	import { cn } from '$lib/utils';
	import type { ButtonVariant, ButtonSize } from './index';
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface Props extends HTMLButtonAttributes {
		variant?: ButtonVariant;
		size?: ButtonSize;
		children?: Snippet;
		class?: string;
	}

	let { variant = 'default', size = 'default', children, class: className, ...restProps }: Props = $props();

	const variantClasses: Record<ButtonVariant, string> = {
		default: 'bg-zinc-900 text-zinc-50 hover:bg-zinc-900/90 dark:bg-zinc-50 dark:text-zinc-900',
		destructive: 'bg-red-500 text-white hover:bg-red-500/90',
		outline: 'border border-zinc-200 bg-white hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950',
		secondary: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-100/80 dark:bg-zinc-800 dark:text-zinc-50',
		ghost: 'hover:bg-zinc-100 dark:hover:bg-zinc-800',
		link: 'text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-50'
	};

	const sizeClasses: Record<ButtonSize, string> = {
		default: 'h-9 px-4 py-2',
		sm: 'h-8 rounded-md px-3 text-xs',
		lg: 'h-10 rounded-md px-8',
		icon: 'h-9 w-9'
	};
</script>

<button
	class={cn(
		'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
		variantClasses[variant],
		sizeClasses[size],
		className
	)}
	{...restProps}
>
	{#if children}{@render children()}{/if}
</button>
