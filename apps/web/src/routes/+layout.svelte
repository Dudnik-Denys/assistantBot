<script lang="ts">
	import '../app.css';
	import favicon from '#lib/assets/favicon.svg';
	import { api, ApiError } from '#lib/api.ts';
	import Message from '#lib/components/Message.svelte';
	import Screen from '#lib/components/Screen.svelte';
	import { initTelegram } from '#lib/telegram.ts';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	type State =
		| { kind: 'loading' }
		| { kind: 'ready' }
		| { kind: 'denied'; telegramId?: string }
		| { kind: 'error'; message: string };

	let state = $state<State>({ kind: 'loading' });

	$effect(() => {
		initTelegram();
		api
			.me()
			.then(() => (state = { kind: 'ready' }))
			.catch((e: unknown) => {
				if (e instanceof ApiError && e.status === 403) {
					const id = e.body.telegramId;
					state = { kind: 'denied', telegramId: typeof id === 'string' ? id : undefined };
				} else {
					state = { kind: 'error', message: e instanceof Error ? e.message : String(e) };
				}
			});
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Ассистент</title>
</svelte:head>

{#if state.kind === 'ready'}
	{@render children()}
{:else}
	<Screen>
		{#if state.kind === 'loading'}
			<Message title="Загрузка…" />
		{:else if state.kind === 'denied'}
			<Message title="Нет доступа">
				Попросите администратора добавить ваш Telegram ID
				{#if state.telegramId}<b class="font-mono text-tg-text select-all">{state.telegramId}</b>{/if}
			</Message>
		{:else}
			<Message title="Не удалось открыть приложение">{state.message}</Message>
		{/if}
	</Screen>
{/if}
