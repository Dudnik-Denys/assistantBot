<script lang="ts">
	import type { Snippet } from 'svelte';
	import { SwipeReveal } from '#lib/reactive/swipe-reveal.svelte.ts';

	/**
	 * Строка списка с действиями под ней: свайп влево открывает `actions` справа, свайп вправо —
	 * закрывает (логика жеста — SwipeReveal). `actions` получает `close`, чтобы закрыть строку
	 * после действия. Скругление — как у `Card`.
	 */
	let { children, actions }: { children: Snippet; actions: Snippet<[close: () => void]> } =
		$props();

	let actionsWidth = $state(0);
	const swipe = new SwipeReveal(() => actionsWidth);
</script>

<div class="relative overflow-hidden rounded-2xl">
	<!-- invisible в закрытом виде: иначе действия просвечивают по скруглённым углам строки -->
	<div
		class={[
			'absolute inset-y-0 right-0 flex',
			swipe.offset === 0 && !swipe.dragging && 'invisible',
		]}
		bind:clientWidth={actionsWidth}
	>
		{@render actions(swipe.close)}
	</div>
	<!-- Жест — только для указателя; действие доступно и без него (кнопка в actions), семантика — у содержимого (ссылка Card). -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class={[
			'relative touch-pan-y select-none',
			'translate-x-[var(--swipe-offset)]',
			!swipe.dragging && 'transition-transform',
		]}
		style:--swipe-offset="{swipe.offset}px"
		onpointerdown={swipe.onpointerdown}
		onpointermove={swipe.onpointermove}
		onpointerup={swipe.onpointerup}
		onpointercancel={swipe.onpointercancel}
		onlostpointercapture={swipe.onpointercancel}
		onclickcapture={swipe.onclickcapture}
	>
		{@render children()}
	</div>
</div>
