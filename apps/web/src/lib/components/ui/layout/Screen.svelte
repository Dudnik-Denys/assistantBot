<script lang="ts">
	import type { Snippet } from 'svelte';

	/** Обёртка страницы: отступы безопасных зон Telegram и ограничение ширины. */
	let { children }: { children: Snippet } = $props();
</script>

<div
	class="mx-auto flex min-h-dvh w-full max-w-xl flex-col pt-page-t pr-page-r pb-page-b pl-page-l"
>
	{@render children()}
</div>
