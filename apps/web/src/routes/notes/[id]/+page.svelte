<script lang="ts">
	import { goto } from '$app/navigation';
	import { api, type NoteDto } from '#lib/api.ts';
	import Message from '#lib/components/Message.svelte';
	import NoteEditor from '#lib/components/NoteEditor.svelte';
	import Screen from '#lib/components/Screen.svelte';
	import { useBackButton } from '#lib/telegram.ts';
	import type { PageProps } from './$types';

	let { params }: PageProps = $props();

	let note = $state<NoteDto | null>(null);
	let error = $state<string | null>(null);

	$effect(() => {
		const id = params.id;
		note = null;
		error = null;
		api.notes
			.get(id)
			.then((n) => (note = n))
			.catch((e: unknown) => (error = e instanceof Error ? e.message : String(e)));
	});

	// Пока заметка не загружена, «Назад» просто возвращает к списку.
	$effect(() => (note ? undefined : useBackButton(() => goto('/notes'))));
</script>

<Screen>
	{#if error}
		<Message title="Не удалось открыть заметку">{error}</Message>
	{:else if !note}
		<Message title="Загрузка…" />
	{:else}
		{#key note.id}
			<NoteEditor {note} />
		{/key}
	{/if}
</Screen>
