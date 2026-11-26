<script lang="ts">
	import { navigating } from '$app/state';
	import { UiText } from '#lib/constants/ui-texts.ts';
	import { DelayedFlag } from '#lib/reactive/delayed-flag.svelte.ts';

	/** Полоска загрузки вверху экрана, пока SvelteKit выполняет `load` новой страницы. */
	interface Props {
		/** Подпись для экранного диктора. */
		label?: string;
	}

	let { label = UiText.PageLoading }: Props = $props();

	/** Задержка перед показом: быстрые переходы проходят без мигания полоски. */
	const SHOW_DELAY_MS = 150;

	const visible = new DelayedFlag(() => Boolean(navigating.to), SHOW_DELAY_MS);
</script>

{#if visible.value}
	<div
		class="fixed inset-x-0 top-safe-top z-50 h-0.5 animate-pulse bg-tg-button"
		role="progressbar"
		aria-label={label}
	></div>
{/if}
