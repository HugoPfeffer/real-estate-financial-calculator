<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<div class="min-h-screen bg-zinc-50 dark:bg-zinc-950">
	{@render children()}
</div>
