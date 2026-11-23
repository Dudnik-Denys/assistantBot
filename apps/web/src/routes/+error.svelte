<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import BackButton from '#lib/components/ui/buttons/BackButton.svelte';
	import Message from '#lib/components/ui/feedback/Message.svelte';
	import Screen from '#lib/components/ui/layout/Screen.svelte';
	import { HttpStatus } from '#lib/constants/http-status.ts';

	/**
	 * Ошибки load и неизвестные адреса. «Назад» ведёт в главное меню.
	 * Заголовок — свой у ошибки (`title`, например «Страница не найдена») или общий; у неожиданных
	 * ошибок текста нет (hooks.client.ts) — показывается только заголовок.
	 */
	const title = $derived(page.error?.title ?? 'Упс… Кажется, что-то пошло не так');
	/** Код — только у ошибок запроса (4xx): код сбоя сервера пользователю ничего не скажет. */
	const caption = $derived(
		page.status < HttpStatus.InternalServerError ? `${page.status} Error` : undefined,
	);
</script>

<Screen>
	<BackButton onback={() => goto(resolve('/'))} label="В меню" />
	<Message {title} {caption} text={page.error?.message} tone="error" level={1} />
</Screen>
