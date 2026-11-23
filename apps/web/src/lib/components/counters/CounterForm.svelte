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
	import NumberField from '#lib/components/ui/forms/NumberField.svelte';
	import SegmentedControl from '#lib/components/ui/forms/SegmentedControl.svelte';
	import Switch from '#lib/components/ui/forms/Switch.svelte';
	import TextField from '#lib/components/ui/forms/TextField.svelte';
	import ActionBar from '#lib/components/ui/layout/ActionBar.svelte';
	import Panel from '#lib/components/ui/layout/Panel.svelte';
	import SectionTitle from '#lib/components/ui/text/SectionTitle.svelte';
	import { COUNTER_DURATION_FIELDS, COUNTER_TIMER_MODES } from '#lib/constants/counters.ts';
	import { errorMessage } from '#lib/errors.ts';
	import { focusField } from '#lib/keyboard.ts';
	import { CounterFormState } from '#lib/reactive/counter-form.svelte.ts';
	import { confirmDialog, haptic } from '#lib/telegram.ts';

	/**
	 * Настройки счётчика: название, таймер (без таймера, на срок, до даты), ручное управление,
	 * показ счёта, повтор и уведомления. Состояние и проверки — `CounterFormState`.
	 * Сохраняется кнопкой: с автосохранением таймер перезапускался бы на каждом
	 * промежуточном вводе даты или срока.
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

	async function save() {
		if (form.problem) return;
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
			placeholder="Например, «Без сахара»"
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
				<div class="grid grid-cols-2 gap-2">
					<TextField label="Начало, дата" type="date" bind:value={form.startDate} required />
					<TextField label="Время" type="time" bind:value={form.startTime} required />
				</div>
			{:else if form.mode === COUNTER_TIMER_MODE.Date}
				<div class="grid grid-cols-2 gap-2">
					<TextField
						label="Окончание, дата"
						type="date"
						min={form.today}
						bind:value={form.targetDate}
						required
					/>
					<TextField label="Время" type="time" bind:value={form.targetTime} required />
				</div>
			{:else}
				<p class="text-sm text-tg-hint">Счётчик без таймера — только ручной: − число +</p>
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
				<Switch
					label="Продолжать с теми же параметрами"
					description={form.mode === COUNTER_TIMER_MODE.Date
						? 'Следующий цикл той же длины, без выбора новой даты'
						: 'Следующий цикл на тот же срок'}
					bind:checked={form.repeatSame}
				/>
				<Switch
					label="Продолжать автоматически"
					description="Новый цикл начнётся сразу после окончания"
					checked={form.repeatSame && form.autoRestart}
					disabled={!form.repeatSame}
					onchange={(checked) => (form.autoRestart = checked)}
				/>
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

	<ActionBar class="mt-auto">
		<Button type="submit" class="flex-1" disabled={saving || form.problem !== null}>
			{initial ? 'Сохранить' : 'Создать'}
		</Button>
	</ActionBar>
</form>
