<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { untrack } from 'svelte';
	import { api, type CounterDto } from '#lib/api.ts';
	import CounterStepper from '#lib/components/counters/CounterStepper.svelte';
	import Button from '#lib/components/ui/buttons/Button.svelte';
	import ProgressRing from '#lib/components/ui/feedback/ProgressRing.svelte';
	import ActionBar from '#lib/components/ui/layout/ActionBar.svelte';
	import PageHeader from '#lib/components/ui/layout/PageHeader.svelte';
	import Panel from '#lib/components/ui/layout/Panel.svelte';
	import { COUNTER_REFRESH_DELAY_MS } from '#lib/constants/counters.ts';
	import {
		isDue,
		isFinished,
		isPaused,
		isRunning,
		isValueVisible,
		removeCounter,
		timerMoment,
	} from '#lib/counters.ts';
	import { runWithFeedback } from '#lib/feedback.ts';
	import { Clock } from '#lib/reactive/clock.svelte.ts';
	import { confirmDialog } from '#lib/telegram.ts';
	import { cycleProgress, formatDateTime, formatRemaining } from '#lib/utils/dates.ts';

	/**
	 * Экран счётчика: круговой прогресс цикла с обратным отсчётом (если есть таймер),
	 * «− число +» и «Сбросить» (ручное управление), «Стоп» и «Старт» (пауза и продолжение,
	 * новый цикл после окончания; можно скрыть в настройках — тогда после окончания «Продолжить»,
	 * а у таймера на паузе «Старт» остаётся).
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
	/** На паузе отсчёт стоит на её начале. */
	const moment = $derived(timerMoment(current, clock.now));
	const remainingMs = $derived(timer ? new Date(timer.targetAt).getTime() - moment : 0);
	/** Время цикла вышло, а сервер ещё отдаёт его идущим — завершаем сами (`finish`). */
	const awaitingWorker = $derived(isDue(current, clock.now));

	// Отсчёт дошёл до нуля — сразу завершить цикл на сервере, не дожидаясь воркера (он — раз
	// в минуту); не вышло (цикл в этот момент обрабатывал воркер, нет связи) — повторить.
	$effect(() => {
		if (!awaitingWorker) return;
		// untrack: ответ `finish` заменяет `current` — эффект не должен перезапускаться от этого,
		// иначе, пока цикл не завершён, запросы шли бы друг за другом без паузы.
		const id = untrack(() => current.id);
		const finish = () =>
			api.counters.finish(id).then(
				(counter) => (current = counter),
				() => {},
			);
		void finish();
		const retry = setInterval(finish, COUNTER_REFRESH_DELAY_MS);
		return () => clearInterval(retry);
	});

	async function act(action: (id: string) => Promise<CounterDto>) {
		busy = true;
		const result = await runWithFeedback(() => action(current.id));
		if (result) current = result.value;
		busy = false;
	}

	/**
	 * «Старт» после окончания цикла: с теми же параметрами — сразу, иначе — в настройки за новой
	 * датой или сроком.
	 */
	function proceed() {
		if (current.repeatSame) return act((id) => api.counters.start(id));
		return goto(resolve('/counters/[id]/edit', { id: current.id }));
	}

	async function reset() {
		const question = timer
			? `Сбросить счёт и таймер «${current.title}»? Таймер встанет на паузу.`
			: `Сбросить счёт «${current.title}»?`;
		if (!(await confirmDialog(question))) return;
		await act((id) => api.counters.reset(id));
	}

	async function remove() {
		if (await removeCounter(current)) await goto(resolve('/counters'));
	}
</script>

<PageHeader
	title={current.title}
	centered
	onback={() => goto(resolve('/counters'))}
	backLabel="К счётчикам"
/>

<div class="flex flex-1 flex-col gap-6">
	{#if timer}
		<ProgressRing
			class="mx-auto w-64 max-w-full"
			progress={cycleProgress(timer.startAt, timer.targetAt, moment)}
			label="Прошедшая часть цикла"
		>
			{#if isFinished(current)}
				<span class="text-xl font-semibold">Цикл завершён</span>
			{:else}
				<span class="text-3xl font-bold tabular-nums">{formatRemaining(remainingMs)}</span>
				<span class="text-sm text-tg-hint">
					{awaitingWorker ? 'Завершаем цикл…' : isPaused(current) ? 'на паузе' : 'осталось'}
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
		<Button disabled={busy} onclick={proceed}>
			{current.startStopHidden ? 'Продолжить' : 'Старт'}
		</Button>
	{:else if isPaused(current)}
		<Button disabled={busy} onclick={() => act((id) => api.counters.start(id))}>Старт</Button>
	{:else if isRunning(current) && !awaitingWorker && !current.startStopHidden}
		<Button disabled={busy} onclick={() => act((id) => api.counters.pause(id))}>Стоп</Button>
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
		<Button class="flex-1" disabled={busy} onclick={reset}>Сбросить</Button>
	{/if}
	<Button class="flex-1" onclick={() => goto(resolve('/counters/[id]/edit', { id: current.id }))}>
		Изменить
	</Button>
	<Button variant="destructive" class="flex-1" onclick={remove}>Удалить</Button>
</ActionBar>
