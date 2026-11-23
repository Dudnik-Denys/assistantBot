<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { api, type CounterDto } from '#lib/api.ts';
	import CounterStepper from '#lib/components/counters/CounterStepper.svelte';
	import Button from '#lib/components/ui/buttons/Button.svelte';
	import ProgressRing from '#lib/components/ui/feedback/ProgressRing.svelte';
	import ActionBar from '#lib/components/ui/layout/ActionBar.svelte';
	import PageHeader from '#lib/components/ui/layout/PageHeader.svelte';
	import Panel from '#lib/components/ui/layout/Panel.svelte';
	import { COUNTER_DEPENDENCY, COUNTER_REFRESH_DELAY_MS } from '#lib/constants/counters.ts';
	import { isFinished, isRunning, isValueVisible, removeCounter } from '#lib/counters.ts';
	import { runWithFeedback } from '#lib/feedback.ts';
	import { Clock } from '#lib/reactive/clock.svelte.ts';
	import { confirmDialog } from '#lib/telegram.ts';
	import { cycleProgress, formatDateTime, formatRemaining } from '#lib/utils/dates.ts';

	/**
	 * Экран счётчика: круговой прогресс цикла с обратным отсчётом (если есть таймер),
	 * «− число +» и «Сбросить» (ручное управление), «Продолжить» после окончания цикла.
	 */
	interface Props {
		counter: CounterDto;
	}

	let { counter }: Props = $props();

	/** Локальная копия: действия возвращают обновлённый счётчик; новый `counter` — заменяет её. */
	let current = $derived(counter);
	let busy = $state(false);

	const clock = new Clock();
	const timeZone = api.user.timeZone;
	const timer = $derived(current.timer);
	const remainingMs = $derived(timer ? new Date(timer.targetAt).getTime() - clock.now : 0);
	/** Время цикла вышло, но сервер ещё не обработал окончание (воркер — раз в минуту). */
	const awaitingWorker = $derived(isRunning(current) && remainingMs <= 0);

	$effect(() => {
		if (!awaitingWorker) return;
		const refresh = setInterval(() => invalidate(COUNTER_DEPENDENCY), COUNTER_REFRESH_DELAY_MS);
		return () => clearInterval(refresh);
	});

	async function act(action: (id: string) => Promise<CounterDto>) {
		busy = true;
		const result = await runWithFeedback(() => action(current.id));
		if (result) current = result.value;
		busy = false;
	}

	/** «Продолжить»: с теми же параметрами — сразу, иначе — в настройки за новой датой или сроком. */
	function proceed() {
		if (current.repeatSame) return act((id) => api.counters.restart(id));
		return goto(resolve('/counters/[id]/edit', { id: current.id }));
	}

	async function reset() {
		if (!(await confirmDialog(`Сбросить счёт «${current.title}»?`))) return;
		await act((id) => api.counters.reset(id));
	}

	async function remove() {
		if (await removeCounter(current)) await goto(resolve('/counters'));
	}
</script>

<PageHeader
	title={current.title}
	onback={() => goto(resolve('/counters'))}
	backLabel="К счётчикам"
/>

<div class="flex flex-1 flex-col gap-6">
	{#if timer}
		<ProgressRing
			class="mx-auto w-64 max-w-full"
			progress={cycleProgress(timer.startAt, timer.targetAt, clock.now)}
			label="Прошедшая часть цикла"
		>
			{#if isFinished(current)}
				<span class="text-xl font-semibold">Цикл завершён</span>
			{:else}
				<span class="text-3xl font-bold tabular-nums">{formatRemaining(remainingMs)}</span>
				<span class="text-sm text-tg-hint">
					{awaitingWorker ? 'Завершаем цикл…' : 'осталось'}
				</span>
			{/if}
			{#if isValueVisible(current) && !current.manual}
				<span class="mt-2 text-sm text-tg-hint">Циклов пройдено: {current.value}</span>
			{/if}
		</ProgressRing>
	{/if}

	{#if current.manual}
		<CounterStepper
			value={current.value}
			{busy}
			ondecrement={() => act((id) => api.counters.decrement(id))}
			onincrement={() => act((id) => api.counters.increment(id))}
		/>
	{/if}

	{#if isFinished(current)}
		<Button disabled={busy} onclick={proceed}>Продолжить</Button>
	{/if}

	{#if timer}
		<Panel class="text-sm">
			<p class="flex justify-between gap-2">
				<span class="text-tg-hint">Начало цикла</span>
				<span>{formatDateTime(timer.startAt, timeZone)}</span>
			</p>
			<p class="flex justify-between gap-2">
				<span class="text-tg-hint">Окончание</span>
				<span>{formatDateTime(timer.targetAt, timeZone)}</span>
			</p>
			{#if current.autoRestart}
				<p class="text-tg-hint">Следующий цикл начнётся автоматически</p>
			{/if}
		</Panel>
	{/if}
</div>

<ActionBar>
	{#if current.manual}
		<Button variant="secondary" class="flex-1" disabled={busy} onclick={reset}>Сбросить</Button>
	{/if}
	<Button
		variant="secondary"
		class="flex-1"
		onclick={() => goto(resolve('/counters/[id]/edit', { id: current.id }))}
	>
		Изменить
	</Button>
	<Button variant="destructive" class="flex-1" onclick={remove}>Удалить</Button>
</ActionBar>
