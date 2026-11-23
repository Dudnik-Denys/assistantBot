<script lang="ts">
	import { COUNTER_VALUE_MIN } from '@tgab/core/constants/counters';

	/** Число с кнопками по бокам: «− 0 +». */
	interface Props {
		value: number;
		ondecrement: () => void;
		onincrement: () => void;
		/** Идёт запрос — кнопки неактивны. */
		busy?: boolean;
	}

	let { value, ondecrement, onincrement, busy = false }: Props = $props();
</script>

<div class="flex items-center justify-center gap-6">
	<button
		type="button"
		aria-label="Уменьшить на 1"
		disabled={busy || value <= COUNTER_VALUE_MIN}
		onclick={ondecrement}
		class={[
			'flex size-14 items-center justify-center rounded-full text-3xl leading-none',
			'bg-surface text-tg-button',
			'transition active:scale-95 disabled:opacity-40',
		]}
	>
		−
	</button>
	<output class="min-w-20 text-center text-5xl font-bold tabular-nums" aria-live="polite">
		{value}
	</output>
	<button
		type="button"
		aria-label="Увеличить на 1"
		disabled={busy}
		onclick={onincrement}
		class={[
			'flex size-14 items-center justify-center rounded-full text-3xl leading-none',
			'bg-tg-button text-tg-button-text',
			'transition active:scale-95 disabled:opacity-40',
		]}
	>
		+
	</button>
</div>
