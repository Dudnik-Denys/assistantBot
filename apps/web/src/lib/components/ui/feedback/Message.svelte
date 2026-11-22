<script lang="ts">
	import type { Snippet } from 'svelte';

	let { title, children }: { title: string; children?: Snippet } = $props();
</script>

<div class="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-16 text-center">
	<p class="text-lg font-semibold">{title}</p>
	{#if children}
		<div class="text-sm text-tg-hint">{@render children()}</div>
	{/if}
</div>
