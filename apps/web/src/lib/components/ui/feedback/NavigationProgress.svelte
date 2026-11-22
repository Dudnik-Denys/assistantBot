<script lang="ts">
	import { navigating } from '$app/state';

	/** Задержка перед показом: быстрые переходы проходят без мигания полоски. */
	const SHOW_DELAY_MS = 150;

	let visible = $state(false);

	// Таймер — побочный эффект, поэтому $effect, а не $derived.
	$effect(() => {
		if (!navigating.to) {
			visible = false;
			return;
		}
		const timer = setTimeout(() => (visible = true), SHOW_DELAY_MS);
		return () => clearTimeout(timer);
	});
</script>

<!-- Полоска загрузки вверху экрана, пока SvelteKit выполняет load для новой страницы. -->
{#if visible}
	<div
		class="fixed inset-x-0 top-safe-top z-50 h-0.5 animate-pulse bg-tg-button"
		role="progressbar"
		aria-label="Загрузка страницы"
	></div>
{/if}
