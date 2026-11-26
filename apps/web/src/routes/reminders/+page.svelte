<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { api, type NotificationDto } from '#lib/api.ts';
	import NotificationCard from '#lib/components/reminders/NotificationCard.svelte';
	import ListState from '#lib/components/ui/feedback/ListState.svelte';
	import Message from '#lib/components/ui/feedback/Message.svelte';
	import PageHeader from '#lib/components/ui/layout/PageHeader.svelte';
	import Screen from '#lib/components/ui/layout/Screen.svelte';
	import ScrollArea from '#lib/components/ui/layout/ScrollArea.svelte';
	import { removeWithConfirm } from '#lib/feedback.ts';
	import { ListLoader } from '#lib/reactive/list-loader.svelte.ts';

	// Пока в разделе только уведомления об окончании циклов счётчиков; поиска нет.
	const loader = new ListLoader((signal) => api.notifications.list('', signal), {
		initialItems: api.notifications.cachedList,
	});

	async function remove(notification: NotificationDto) {
		const subject = `уведомление о счётчике «${notification.counter.title}»`;
		if (!(await removeWithConfirm(subject, () => api.notifications.remove(notification.id))))
			return;
		loader.items = loader.items?.filter((item) => item.id !== notification.id) ?? null;
	}
</script>

<Screen fit>
	<PageHeader title="Напоминания" onback={() => goto(resolve('/'))} backLabel="В меню" />

	<ScrollArea>
		<ListState items={loader.items} error={loader.error} reconnecting={loader.reconnecting}>
			{#snippet empty()}
				<Message
					class="flex-none"
					title="Уведомлений пока нет"
					text="Здесь появятся сообщения об окончании циклов счётчиков"
				/>
			{/snippet}
			{#snippet children(notifications)}
				<ul class="flex flex-col gap-2 pb-6">
					{#each notifications as notification (notification.id)}
						<li><NotificationCard {notification} onremove={() => remove(notification)} /></li>
					{/each}
				</ul>
			{/snippet}
		</ListState>
	</ScrollArea>
</Screen>
