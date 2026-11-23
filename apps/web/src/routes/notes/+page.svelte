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
	import { errorMessage } from '#lib/errors.ts';
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

<Screen>
	<PageHeader title="Заметки" onback={() => goto(resolve('/'))} backLabel="В меню">
		<SearchBar bind:value={search.query} label="Поиск по заметкам" />
	</PageHeader>

	{#if search.error}
		<Message title="Ошибка">{search.error}</Message>
	{:else if search.items === null}
		<Loading title={search.reconnecting ? 'Идёт попытка соединения…' : 'Загрузка…'} />
	{:else}
		{#if search.reconnecting}
			<Notice pending>Нет связи. Пробуем снова…</Notice>
		{/if}
		{#if search.items.length === 0}
			{#if search.hasQuery}
				<Message title="Ничего не найдено">Попробуйте другой запрос</Message>
			{:else}
				<Message title="Заметок пока нет">Нажмите «+», чтобы создать первую</Message>
			{/if}
		{:else}
			<ul class="flex flex-col gap-2 pb-20">
				{#each search.items as note (note.id)}
					<li><NoteCard {note} onremove={() => removeNote(note)} /></li>
				{/each}
			</ul>
		{/if}
	{/if}

	<FloatingButton href={resolve('/notes/new')} label="Новая заметка">+</FloatingButton>
</Screen>
