<script lang="ts">
	import { COUNTER_VALUE_MIN } from '@tgab/core/constants/counters';
	import RoundButton from '#lib/components/ui/buttons/RoundButton.svelte';

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
	<RoundButton
		label="Уменьшить на 1"
		variant="secondary"
		disabled={busy || value <= COUNTER_VALUE_MIN}
		onclick={ondecrement}
	>
		−
	</RoundButton>
	<output class="min-w-20 text-center text-5xl font-bold tabular-nums" aria-live="polite">
		{value}
	</output>
	<RoundButton label="Увеличить на 1" disabled={busy} onclick={onincrement}>+</RoundButton>
</div>
