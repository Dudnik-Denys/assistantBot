<script lang="ts">
	import type { Snippet } from 'svelte';
	import { TestId } from '#lib/constants/test-ids.ts';
	import { SwipeReveal } from '#lib/reactive/swipe-reveal.svelte.ts';

	/**
	 * Строка списка с действиями справа: свайп влево выдвигает `actions` из-за края строки, свайп
	 * вправо — убирает (логика жеста — SwipeReveal). Содержимое и действия стоят в одном ряду и
	 * едут вместе — действия не лежат под содержимым. Скругление — как у `Card`.
	 */
	interface Props {
		/** Содержимое строки (обычно `Card`). */
		children: Snippet;
		/** Кнопки справа; получают `close`, чтобы закрыть строку после действия. */
		actions: Snippet<[close: () => void]>;
	}

	let { children, actions }: Props = $props();

	let actionsWidth = $state(0);
	let row = $state<HTMLElement>();
	const swipe = new SwipeReveal(
		() => actionsWidth,
		() => row,
	);
</script>

<div class="overflow-hidden rounded-2xl" bind:this={row} data-testid={TestId.Common.SwipeRow}>
	<div
		class={[
			'flex touch-pan-y',
			'translate-x-(--swipe-offset)',
			!swipe.dragging && 'transition-transform motion-reduce:transition-none',
		]}
		style:--swipe-offset="{swipe.offset}px"
	>
		<!-- Жест — только для указателя; действие доступно и без него (кнопка в actions),
		    семантика — у содержимого (ссылка Card). -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="w-full shrink-0 select-none"
			onpointerdown={swipe.onpointerdown}
			onpointermove={swipe.onpointermove}
			onpointerup={swipe.onpointerup}
			onpointercancel={swipe.onpointercancel}
			onclickcapture={swipe.onclickcapture}
		>
			{@render children()}
		</div>
		<div class="flex shrink-0" bind:clientWidth={actionsWidth}>
			{@render actions(swipe.close)}
		</div>
	</div>
</div>
