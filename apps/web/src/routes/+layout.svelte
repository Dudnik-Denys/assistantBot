<script lang="ts">
	import '../app.css';
	import favicon from '#lib/assets/favicon.svg';
	import Message from '#lib/components/ui/feedback/Message.svelte';
	import NavigationProgress from '#lib/components/ui/feedback/NavigationProgress.svelte';
	import Screen from '#lib/components/ui/layout/Screen.svelte';
	import { dismissKeyboardOnSwipeDown } from '#lib/keyboard.ts';
	import { initTelegram } from '#lib/telegram.ts';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	// ready() — после первой отрисовки: до этого Telegram показывает свой индикатор загрузки.
	$effect(() => initTelegram());
	// Свайп вниз в любом месте закрывает экранную клавиатуру; слушатели снимаются вместе с layout.
	$effect(() => dismissKeyboardOnSwipeDown());
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Ассистент</title>
</svelte:head>

<NavigationProgress />

{#if data.access.kind === 'ready'}
	{@render children()}
{:else}
	<Screen>
		{#if data.access.kind === 'denied'}
			<Message title="Нет доступа" tone="error" level={1}>
				Попросите администратора добавить ваш Telegram ID
				{#if data.access.telegramId}<b class="font-mono text-tg-text select-all">
						{data.access.telegramId}
					</b>{/if}
			</Message>
		{:else}
			<Message
				title="Не удалось открыть приложение"
				text={data.access.message}
				tone="error"
				level={1}
			/>
		{/if}
	</Screen>
{/if}
