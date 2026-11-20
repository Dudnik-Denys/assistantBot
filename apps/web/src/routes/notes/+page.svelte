<script lang="ts">
	import { api, type NoteDto } from '#lib/api.ts';
	import Message from '#lib/components/Message.svelte';
	import NoteCard from '#lib/components/NoteCard.svelte';
	import Screen from '#lib/components/Screen.svelte';
	import SearchBar from '#lib/components/SearchBar.svelte';
	import { goto } from '$app/navigation';
	import { haptic, useBackButton } from '#lib/telegram.ts';

	$effect(() => useBackButton(() => goto('/')));

	let query = $state('');
	let notes = $state<NoteDto[] | null>(null);
	let error = $state<string | null>(null);

	$effect(() => {
		const q = query.trim();
		const controller = new AbortController();
		// Небольшая задержка, чтобы не слать запрос на каждый символ.
		const timer = setTimeout(
			() => {
				api.notes
					.list(q, controller.signal)
					.then((list) => {
						notes = list;
						error = null;
					})
					.catch((e: unknown) => {
						if (controller.signal.aborted) return;
						error = e instanceof Error ? e.message : String(e);
					});
			},
			q ? 250 : 0
		);
		return () => {
			clearTimeout(timer);
			controller.abort();
		};
	});
</script>

<Screen>
	<header
		class="sticky top-0 z-10 -mt-page-t -mr-page-r -ml-page-l bg-tg-bg pt-page-t pr-page-r pb-3 pl-page-l"
	>
		<h1 class="mb-3 text-2xl font-bold">Заметки</h1>
		<SearchBar bind:value={query} />
	</header>

	{#if error}
		<Message title="Ошибка">{error}</Message>
	{:else if notes === null}
		<Message title="Загрузка…" />
	{:else if notes.length === 0}
		{#if query.trim()}
			<Message title="Ничего не найдено">Попробуйте другой запрос</Message>
		{:else}
			<Message title="Заметок пока нет">Нажмите «+», чтобы создать первую</Message>
		{/if}
	{:else}
		<ul class="flex flex-col gap-2 pb-20">
			{#each notes as note (note.id)}
				<li><NoteCard {note} /></li>
			{/each}
		</ul>
	{/if}

	<a
		href="/notes/new"
		onclick={() => haptic('light')}
		aria-label="Новая заметка"
		class="fixed right-page-r bottom-page-b flex size-14 items-center justify-center rounded-full bg-tg-button text-3xl leading-none text-tg-button-text shadow-lg shadow-black/20 transition active:scale-95"
		>+</a
	>
</Screen>
