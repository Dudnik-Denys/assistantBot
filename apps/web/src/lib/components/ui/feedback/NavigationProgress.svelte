<script lang="ts">
	import { navigating } from '$app/state';
	import { DelayedFlag } from '#lib/reactive/delayed-flag.svelte.ts';

	/** Задержка перед показом: быстрые переходы проходят без мигания полоски. */
	const SHOW_DELAY_MS = 150;

	const visible = new DelayedFlag(() => Boolean(navigating.to), SHOW_DELAY_MS);
</script>

<!-- Полоска загрузки вверху экрана, пока SvelteKit выполняет load для новой страницы. -->
{#if visible.value}
	<div
		class="fixed inset-x-0 top-safe-top z-50 h-0.5 animate-pulse bg-tg-button"
		role="progressbar"
		aria-label="Загрузка страницы"
	></div>
{/if}
