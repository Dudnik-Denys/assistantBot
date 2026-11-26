<script lang="ts">
	import {
		COUNTER_DURATION_PART_MAX,
		COUNTER_TIMER_MODE,
		COUNTER_TITLE_MAX,
	} from '@tgab/core/constants/counters';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { api, type CounterDto } from '#lib/api.ts';
	import BackButton from '#lib/components/ui/buttons/BackButton.svelte';
	import Button from '#lib/components/ui/buttons/Button.svelte';
	import DateField from '#lib/components/ui/forms/DateField.svelte';
	import NumberField from '#lib/components/ui/forms/NumberField.svelte';
	import SegmentedControl from '#lib/components/ui/forms/SegmentedControl.svelte';
	import Switch from '#lib/components/ui/forms/Switch.svelte';
	import TextField from '#lib/components/ui/forms/TextField.svelte';
	import TimeField from '#lib/components/ui/forms/TimeField.svelte';
	import ActionBar from '#lib/components/ui/layout/ActionBar.svelte';
	import Panel from '#lib/components/ui/layout/Panel.svelte';
	import SectionTitle from '#lib/components/ui/text/SectionTitle.svelte';
	import { COUNTER_DURATION_FIELDS, COUNTER_TIMER_MODES } from '#lib/constants/counters.ts';
	import { isFinished } from '#lib/counters.ts';
	import { errorMessage } from '#lib/errors.ts';
	import { focusField } from '#lib/keyboard.ts';
	import { CounterFormState } from '#lib/reactive/counter-form.svelte.ts';
	import { confirmDialog, haptic } from '#lib/telegram.ts';

	/**
	 * Настройки счётчика: название, таймер (без таймера, на срок, до даты), ручное управление,
	 * показ счёта, повтор и уведомления. Состояние и проверки — `CounterFormState`.
	 * Сохраняется кнопкой: с автосохранением таймер перезапускался бы на каждом
	 * промежуточном вводе даты или срока. Кнопка — последний элемент формы, а не
	 * панель у низа окна: прилипшая, она лежала поверх полей.
	 */
	interface Props {
		/** Счётчик для изменения; нет — новый. */
		counter?: CounterDto;
	}

	let { counter }: Props = $props();

	// Форма держит локальную копию; исходный счётчик нужен только для начальных значений.
	// svelte-ignore state_referenced_locally
	const initial = counter;
	const form = new CounterFormState(initial, api.user.timeZone);

	let saving = $state(false);
	let saveError = $state<string | null>(null);

	/** Идущий (или на паузе) таймер с новыми параметрами начнётся заново — спросить. */
	async function confirmTimerRestart(): Promise<boolean> {
		if (!initial?.timer || isFinished(initial) || !form.timerDirty) return true;
		return confirmDialog('Таймер начнётся заново, число циклов сохранится. Сохранить?');
	}

	async function save() {
		if (form.problem || !(await confirmTimerRestart())) return;
		saving = true;
		saveError = null;
		try {
			const saved = initial
				? await api.counters.update(initial.id, form.input)
				: await api.counters.create(form.input);
			haptic('success');
			await goto(resolve('/counters/[id]', { id: saved.id }), { replaceState: !initial });
		} catch (error) {
			haptic('error');
			saveError = errorMessage(error);
		} finally {
			saving = false;
		}
	}

	async function back() {
		if (form.dirty && !(await confirmDialog('Изменения не сохранятся. Выйти?'))) return;
		if (initial) await goto(resolve('/counters/[id]', { id: initial.id }));
		else await goto(resolve('/counters'));
	}

	/** Новый счётчик — сразу фокус в название. */
	function focusIfNew(field: HTMLInputElement) {
		if (!initial) focusField(field);
	}
</script>

<BackButton onback={back} />

<form
	class="flex flex-1 flex-col gap-4"
	onsubmit={(event) => {
		event.preventDefault();
		void save();
	}}
>
	<h1 class="text-2xl font-bold">{initial ? 'Настройки счётчика' : 'Новый счётчик'}</h1>

	<Panel>
		<TextField
			{@attach focusIfNew}
			label="Название"
			bind:value={form.title}
			maxlength={COUNTER_TITLE_MAX}
			placeholder="Название"
		/>
	</Panel>

	<section>
		<SectionTitle>Таймер</SectionTitle>
		<Panel>
			<SegmentedControl
				options={COUNTER_TIMER_MODES}
				bind:value={form.mode}
				label="Режим таймера"
			/>

			{#if form.mode === COUNTER_TIMER_MODE.Duration}
				<div class="grid grid-cols-5 gap-2">
					{#each COUNTER_DURATION_FIELDS as field (field.part)}
						<NumberField
							label={field.label}
							bind:value={form.duration[field.part]}
							max={COUNTER_DURATION_PART_MAX}
						/>
					{/each}
				</div>
				<Switch
					label="Старт — текущее время"
					description="Цикл начнётся в момент сохранения"
					checked={!form.customStart}
					onchange={(checked) => (form.customStart = !checked)}
				/>
				<div class="grid grid-cols-2 gap-2">
					<DateField
						label="Начало, дата"
						bind:value={form.startDate}
						disabled={!form.customStart}
						required
					/>
					<TimeField
						label="Время"
						bind:value={form.startTime}
						disabled={!form.customStart}
						required
					/>
				</div>
			{:else if form.mode === COUNTER_TIMER_MODE.Date}
				<div class="grid grid-cols-2 gap-2">
					<DateField
						label="Окончание, дата"
						min={form.today}
						bind:value={form.targetDate}
						required
					/>
					<TimeField label="Время" bind:value={form.targetTime} required />
				</div>
			{:else}
				<p class="text-sm text-tg-hint">Счётчик без таймера — только ручной: − число +</p>
			{/if}

			{#if form.hasTimer}
				<Switch
					label="Кнопки «Старт» и «Стоп»"
					description="Пауза и продолжение на экране счётчика"
					checked={!form.startStopHidden}
					onchange={(checked) => (form.startStopHidden = !checked)}
				/>
			{/if}
		</Panel>
	</section>

	<section>
		<SectionTitle>Счёт</SectionTitle>
		<Panel>
			<Switch
				label="Ручное управление"
				description={form.hasTimer
					? 'Кнопки −, + и «Сбросить» на экране счётчика'
					: 'Без таймера — всегда'}
				checked={!form.hasTimer || form.manual}
				disabled={!form.hasTimer}
				onchange={(checked) => (form.manual = checked)}
			/>
			<Switch
				label="Показывать счёт"
				description={form.manual || !form.hasTimer
					? 'При ручном управлении — всегда'
					: 'Число циклов на экране счётчика'}
				checked={!form.hasTimer || form.manual || form.showValue}
				disabled={!form.hasTimer || form.manual}
				onchange={(checked) => (form.showValue = checked)}
			/>
			{#if initial?.timer}
				<p class="text-sm text-tg-hint">Циклов пройдено: {initial.value}</p>
			{/if}
		</Panel>
	</section>

	{#if form.hasTimer}
		<section>
			<SectionTitle>Окончание цикла</SectionTitle>
			<Panel>
				<!-- до даты продолжения нет: следующий цикл вёл бы к дате, которую не выбирали -->
				{#if form.mode === COUNTER_TIMER_MODE.Duration}
					<Switch
						label="Продолжать с теми же параметрами"
						description="Следующий цикл на тот же срок"
						bind:checked={form.repeatSame}
					/>
					<Switch
						label="Продолжать автоматически"
						description="Новый цикл начнётся сразу после окончания"
						checked={form.repeatSame && form.autoRestart}
						disabled={!form.repeatSame}
						onchange={(checked) => (form.autoRestart = checked)}
					/>
				{/if}
				<Switch
					label="Уведомлять"
					description="Сообщение в боте и в разделе «Напоминания»"
					bind:checked={form.notify}
				/>
			</Panel>
		</section>
	{/if}
	<p class="min-h-5 text-sm" role="alert">
		{#if saveError}
			<span class="text-tg-destructive">{saveError}</span>
		{:else if form.problem && (form.dirty || initial)}
			<span class="text-tg-hint">{form.problem}</span>
		{/if}
	</p>

	<!-- static: не прилипает к низу окна, стоит после всех настроек -->
	<ActionBar class="static mt-auto">
		<Button type="submit" class="flex-1" disabled={saving || form.problem !== null}>
			{initial ? 'Сохранить' : 'Создать'}
		</Button>
	</ActionBar>
</form>
