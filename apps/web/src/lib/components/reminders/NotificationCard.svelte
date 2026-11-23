<script lang="ts">
	import { resolve } from '$app/paths';
	import type { NotificationDto } from '#lib/api.ts';
	import SwipeDeleteButton from '#lib/components/ui/buttons/SwipeDeleteButton.svelte';
	import Card from '#lib/components/ui/layout/Card.svelte';
	import SwipeActions from '#lib/components/ui/layout/SwipeActions.svelte';
	import { formatShortDate } from '#lib/utils/dates.ts';

	/** Уведомление в списке: счётчик, номер цикла и время; непрочитанное — с точкой. */
	interface Props {
		notification: NotificationDto;
		/** Удалить; строка закрывается, когда промис завершится. */
		onremove: () => Promise<void>;
	}

	let { notification, onremove }: Props = $props();

	const unread = $derived(notification.readAt === null);
</script>

<SwipeActions>
	<Card
		href={resolve('/reminders/notifications/[id]', { id: notification.id })}
		draggable={false}
		class="flex items-center gap-3"
	>
		<span
			class={['size-2 shrink-0 rounded-full', unread ? 'bg-tg-button' : 'bg-transparent']}
			aria-hidden="true"
		></span>
		<span class="min-w-0 flex-1">
			<span class={['block truncate', unread && 'font-semibold']}>
				⏱ {notification.counter.title}
			</span>
			<span class="block truncate text-sm text-tg-hint">
				Цикл завершён · {notification.cycle}
				{#if unread}<span class="sr-only">(не прочитано)</span>{/if}
			</span>
		</span>
		<time class="shrink-0 text-xs text-tg-hint" datetime={notification.finishedAt}>
			{formatShortDate(notification.finishedAt)}
		</time>
	</Card>

	{#snippet actions(close)}
		<SwipeDeleteButton {onremove} {close} />
	{/snippet}
</SwipeActions>
