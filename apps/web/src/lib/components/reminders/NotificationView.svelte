<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { api, type NotificationDto } from '#lib/api.ts';
	import Button from '#lib/components/ui/buttons/Button.svelte';
	import ActionBar from '#lib/components/ui/layout/ActionBar.svelte';
	import PageHeader from '#lib/components/ui/layout/PageHeader.svelte';
	import Panel from '#lib/components/ui/layout/Panel.svelte';
	import { runWithFeedback } from '#lib/feedback.ts';
	import { formatDateTime } from '#lib/utils/dates.ts';

	/**
	 * Уведомление об окончании цикла счётчика (сюда ведёт ссылка из бота): когда закончился цикл,
	 * сколько пройдено; «Продолжить», если цикл ждёт продолжения, и переход к счётчику.
	 */
	interface Props {
		notification: NotificationDto;
	}

	let { notification }: Props = $props();

	let finished = $derived(notification.counter.finished);

	// Уведомление показано пользователю — отметить прочитанным (кеш списка обновит API).
	// Ошибка не мешает экрану: отметка повторится при следующем открытии.
	$effect(() => {
		if (notification.readAt === null) api.notifications.markRead(notification.id).catch(() => {});
	});
	let busy = $state(false);
	const counterHref = $derived(resolve('/counters/[id]', { id: notification.counter.id }));

	/** С теми же параметрами — сразу, иначе — в настройки счётчика за новой датой или сроком. */
	async function proceed() {
		const { id, repeatSame } = notification.counter;
		if (!repeatSame) return goto(resolve('/counters/[id]/edit', { id }));
		busy = true;
		if (await runWithFeedback(() => api.counters.start(id))) finished = false;
		busy = false;
	}
</script>

<PageHeader
	title="Цикл завершён"
	onback={() => goto(resolve('/reminders'))}
	backLabel="К напоминаниям"
/>

<div class="flex flex-1 flex-col gap-4">
	<Panel>
		<p class="text-lg font-semibold wrap-break-word">⏱ {notification.counter.title}</p>
		<p class="flex justify-between gap-2 text-sm">
			<span class="text-tg-hint">Окончание цикла</span>
			<span>{formatDateTime(notification.finishedAt, api.user.timeZone)}</span>
		</p>
		<p class="flex justify-between gap-2 text-sm">
			<span class="text-tg-hint">Циклов пройдено</span>
			<span>{notification.cycle}</span>
		</p>
	</Panel>
	{#if !finished}
		<p class="text-sm text-tg-hint">Счётчик уже идёт: следующий цикл запущен.</p>
	{/if}
</div>

<ActionBar>
	{#if finished}
		<Button class="flex-1" disabled={busy} onclick={proceed}>Продолжить</Button>
	{/if}
	<Button variant="secondary" class="flex-1" onclick={() => goto(counterHref)}>
		Открыть счётчик
	</Button>
</ActionBar>
