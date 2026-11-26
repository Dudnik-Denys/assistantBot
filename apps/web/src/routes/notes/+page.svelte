<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { api, type NoteDto } from '#lib/api.ts';
	import NoteCard from '#lib/components/notes/NoteCard.svelte';
	import FloatingButton from '#lib/components/ui/buttons/FloatingButton.svelte';
	import ListState from '#lib/components/ui/feedback/ListState.svelte';
	import Message from '#lib/components/ui/feedback/Message.svelte';
	import SearchBar from '#lib/components/ui/forms/SearchBar.svelte';
	import PageHeader from '#lib/components/ui/layout/PageHeader.svelte';
	import Screen from '#lib/components/ui/layout/Screen.svelte';
	import ScrollArea from '#lib/components/ui/layout/ScrollArea.svelte';
	import { TestId } from '#lib/constants/test-ids.ts';
	import { removeWithConfirm } from '#lib/feedback.ts';
	import { holdKeyboard } from '#lib/keyboard.ts';
	import { DebouncedSearch } from '#lib/reactive/debounced-search.svelte.ts';

	// Последний список показывается сразу, свежий подгружается в фоне.
	const search = new DebouncedSearch<NoteDto>((query, signal) => api.notes.list(query, signal), {
		initialItems: api.notes.cachedList,
	});

	async function removeNote(note: NoteDto) {
		if (!(await removeWithConfirm(`заметку «${note.title}»`, () => api.notes.remove(note.id))))
			return;
		search.items = search.items?.filter((item) => item.id !== note.id) ?? null;
	}
</script>

<Screen fit>
	<PageHeader title="Заметки" onback={() => goto(resolve('/'))} backLabel="В меню">
		<SearchBar bind:value={search.query} label="Поиск по заметкам" />
	</PageHeader>

	<!-- Сообщения — сразу под шапкой, а не по центру: при закрытии клавиатуры высота окна
	     меняется рывком, и сообщение по центру прыгало бы вместе с ней. -->
	<ScrollArea>
		<ListState items={search.items} error={search.error} reconnecting={search.reconnecting}>
			{#snippet empty()}
				{#if search.hasQuery}
					<Message
						class="flex-none"
						title="Ничего не найдено"
						text="Попробуйте другой запрос"
						data-testid={TestId.NotesList.NotFound}
					/>
				{:else}
					<Message
						class="flex-none"
						title="У вас пока нет ни одной заметки"
						text="Нажмите «+», чтобы создать первую"
						data-testid={TestId.NotesList.Empty}
					/>
				{/if}
			{/snippet}
			{#snippet children(notes)}
				<ul class="flex flex-col gap-2 pb-20">
					{#each notes as note (note.id)}
						<li><NoteCard {note} onremove={() => removeNote(note)} /></li>
					{/each}
				</ul>
			{/snippet}
		</ListState>
	</ScrollArea>

	<!-- клавиатура открывается сразу по касанию: на iOS иначе фокус в заголовок не встанет -->
	<FloatingButton href={resolve('/notes/new')} label="Новая заметка" onopen={holdKeyboard}>
		+
	</FloatingButton>
</Screen>
