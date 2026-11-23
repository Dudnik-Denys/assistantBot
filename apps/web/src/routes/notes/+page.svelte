<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { api, type NoteDto } from '#lib/api.ts';
	import NoteCard from '#lib/components/notes/NoteCard.svelte';
	import FloatingButton from '#lib/components/ui/buttons/FloatingButton.svelte';
	import Loading from '#lib/components/ui/feedback/Loading.svelte';
	import Message from '#lib/components/ui/feedback/Message.svelte';
	import Notice from '#lib/components/ui/feedback/Notice.svelte';
	import SearchBar from '#lib/components/ui/forms/SearchBar.svelte';
	import PageHeader from '#lib/components/ui/layout/PageHeader.svelte';
	import Screen from '#lib/components/ui/layout/Screen.svelte';
	import ScrollArea from '#lib/components/ui/layout/ScrollArea.svelte';
	import { errorMessage } from '#lib/errors.ts';
	import { holdKeyboard } from '#lib/keyboard.ts';
	import { DebouncedSearch } from '#lib/reactive/debounced-search.svelte.ts';
	import { alertDialog, confirmDialog, haptic } from '#lib/telegram.ts';

	// Последний список показывается сразу, свежий подгружается в фоне.
	const search = new DebouncedSearch<NoteDto>((query, signal) => api.notes.list(query, signal), {
		initialItems: api.notes.cachedList,
	});

	async function removeNote(note: NoteDto) {
		const confirmed = await confirmDialog(
			`Вы уверены, что хотите удалить заметку «${note.title}»?`,
			{ confirmText: 'Да', cancelText: 'Нет', destructive: true },
		);
		if (!confirmed) return;
		try {
			await api.notes.remove(note.id);
			haptic('warning');
			search.items = search.items?.filter((item) => item.id !== note.id) ?? null;
		} catch (removeError) {
			haptic('error');
			await alertDialog(errorMessage(removeError));
		}
	}
</script>

<Screen fit>
	<PageHeader title="Заметки" onback={() => goto(resolve('/'))} backLabel="В меню">
		<SearchBar bind:value={search.query} label="Поиск по заметкам" />
	</PageHeader>

	<!-- Сообщения — сразу под шапкой, а не по центру: при закрытии клавиатуры высота окна
	     меняется рывком, и сообщение по центру прыгало бы вместе с ней. -->
	<ScrollArea>
		{#if search.error}
			<Message class="flex-none" title="Ошибка" text={search.error} tone="error" />
		{:else if search.items === null}
			<Loading title={search.reconnecting ? 'Идёт попытка соединения…' : 'Загрузка…'} />
		{:else}
			{#if search.reconnecting}
				<Notice pending>Нет связи. Пробуем снова…</Notice>
			{/if}
			{#if search.items.length === 0}
				{#if search.hasQuery}
					<Message class="flex-none" title="Ничего не найдено" text="Попробуйте другой запрос" />
				{:else}
					<Message
						class="flex-none"
						title="У вас пока нет ни одной заметки"
						text="Нажмите «+», чтобы создать первую"
					/>
				{/if}
			{:else}
				<ul class="flex flex-col gap-2 pb-20">
					{#each search.items as note (note.id)}
						<li><NoteCard {note} onremove={() => removeNote(note)} /></li>
					{/each}
				</ul>
			{/if}
		{/if}
	</ScrollArea>

	<!-- клавиатура открывается сразу по касанию: на iOS иначе фокус в заголовок не встанет -->
	<FloatingButton href={resolve('/notes/new')} label="Новая заметка" onopen={holdKeyboard}>
		+
	</FloatingButton>
</Screen>
