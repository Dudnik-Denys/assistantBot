<script lang="ts">
	import NotificationView from '#lib/components/reminders/NotificationView.svelte';
	import Screen from '#lib/components/ui/layout/Screen.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<Screen>
	{#key data.notification.id}
		<NotificationView notification={data.notification} />
	{/key}
</Screen>
