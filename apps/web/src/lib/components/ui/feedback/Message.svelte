<script lang="ts">
	import type { Snippet } from 'svelte';

	/** `icon` — над заголовком (например, Spinner); `caption` — мелкая подпись под текстом. */
	let {
		title,
		caption,
		icon,
		children,
	}: { title: string; caption?: string; icon?: Snippet; children?: Snippet } = $props();
</script>

<div class="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-16 text-center">
	{#if icon}
		<div class="mb-2">{@render icon()}</div>
	{/if}
	<p class="text-lg font-semibold">{title}</p>
	{#if children}
		<div class="text-sm text-tg-hint">{@render children()}</div>
	{/if}
	{#if caption}
		<p class="text-xs text-tg-hint">{caption}</p>
	{/if}
</div>
