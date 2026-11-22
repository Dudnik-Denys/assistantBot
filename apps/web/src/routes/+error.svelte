<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import BackButton from '#lib/components/ui/buttons/BackButton.svelte';
	import Message from '#lib/components/ui/feedback/Message.svelte';
	import Screen from '#lib/components/ui/layout/Screen.svelte';
	import { HttpStatus } from '#lib/constants/http-status.ts';

	/** Ошибки load и неизвестные адреса. «Назад» ведёт в главное меню. */
	const title = $derived(
		page.status === HttpStatus.NotFound ? 'Не найдено' : 'Что-то пошло не так',
	);
</script>

<Screen>
	<BackButton onback={() => goto(resolve('/'))} label="В меню" />
	<Message {title}>{page.error?.message}</Message>
</Screen>
