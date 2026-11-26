<script lang="ts">
	import { resolve } from '$app/paths';
	import type { CounterDto } from '#lib/api.ts';
	import SwipeDeleteButton from '#lib/components/ui/buttons/SwipeDeleteButton.svelte';
	import Card from '#lib/components/ui/layout/Card.svelte';
	import SwipeActions from '#lib/components/ui/layout/SwipeActions.svelte';
	import { isFinished, isPaused, isValueVisible, timerMoment } from '#lib/counters.ts';
	import { formatRemaining } from '#lib/utils/dates.ts';

	/** Счётчик в списке: название, состояние таймера и число; свайп влево — «Удалить». */
	interface Props {
		counter: CounterDto;
		/** Текущее время (мс) — для обратного отсчёта; общее для всего списка. */
		now: number;
		/** Спросить подтверждение и удалить; строка закрывается, когда промис завершится. */
		onremove: () => Promise<void>;
	}

	let { counter, now, onremove }: Props = $props();

	const status = $derived.by(() => {
		if (!counter.timer) return 'Ручной счётчик';
		if (isFinished(counter)) return 'Цикл завершён';
		const remaining = formatRemaining(
			new Date(counter.timer.targetAt).getTime() - timerMoment(counter, now),
		);
		return isPaused(counter) ? `На паузе · осталось ${remaining}` : `Осталось ${remaining}`;
	});
</script>

<SwipeActions>
	<Card
		href={resolve('/counters/[id]', { id: counter.id })}
		draggable={false}
		class="flex items-center gap-3"
	>
		<span class="min-w-0 flex-1">
			<span class="block truncate font-semibold">{counter.title}</span>
			<span
				class={[
					'block truncate text-sm tabular-nums',
					isFinished(counter) ? 'text-tg-link' : 'text-tg-hint',
				]}
			>
				{status}
			</span>
		</span>
		{#if isValueVisible(counter)}
			<span class="shrink-0 text-2xl font-bold tabular-nums">{counter.value}</span>
		{/if}
	</Card>

	{#snippet actions(close)}
		<SwipeDeleteButton {onremove} {close} />
	{/snippet}
</SwipeActions>
