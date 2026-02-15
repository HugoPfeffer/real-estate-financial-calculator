<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	interface Props { children?: Snippet; class?: string }
	let { children, class: className }: Props = $props();
</script>

<div class="relative w-full overflow-auto">
	<table class={cn('w-full caption-bottom text-sm', className)}>
		{#if children}{@render children()}{/if}
	</table>
</div>
