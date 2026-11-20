<script lang="ts">
	import { goto } from '$app/navigation';
	import { api, type NoteDto } from '#lib/api.ts';
	import { formatNoteDate } from '#lib/format.ts';
	import { displayUrl, linkify } from '#lib/linkify.ts';
	import { confirmDialog, haptic, isInTelegram, openLink, useBackButton } from '#lib/telegram.ts';
	import Button from './Button.svelte';

	/** note отсутствует — создание новой заметки. */
	let { note }: { note?: NoteDto } = $props();

	// Редактор держит локальную копию; исходная заметка нужна только для сравнения.
	// svelte-ignore state_referenced_locally
	let title = $state(note?.title ?? '');
	// svelte-ignore state_referenced_locally
	let content = $state(note?.content ?? '');
	let saving = $state(false);
	let error = $state<string | null>(null);

	const dirty = $derived(title !== (note?.title ?? '') || content !== (note?.content ?? ''));
	const empty = $derived(!title.trim() && !content.trim());
	const links = $derived([
		...new Set(linkify(content).flatMap((s) => (s.type === 'link' ? [s.href] : [])))
	]);

	async function back() {
		if (dirty && !empty && !(await confirmDialog('Выйти без сохранения изменений?'))) return;
		goto('/notes');
	}

	async function save() {
		if (saving || empty) return;
		saving = true;
		error = null;
		try {
			const input = { title, content };
			if (note) await api.notes.update(note.id, input);
			else await api.notes.create(input);
			haptic('success');
			goto('/notes');
		} catch (e) {
			haptic('error');
			error = e instanceof Error ? e.message : String(e);
		} finally {
			saving = false;
		}
	}

	async function remove() {
		if (!note || !(await confirmDialog('Удалить заметку?'))) return;
		try {
			await api.notes.remove(note.id);
			haptic('warning');
			goto('/notes');
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		}
	}

	function onKeydown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') save();
	}

	$effect(() => useBackButton(back));
</script>

<svelte:window onkeydown={onKeydown} />

{#if !isInTelegram()}
	<button type="button" class="mb-2 self-start text-tg-link" onclick={back}>‹ Назад</button>
{/if}

<form
	class="flex flex-1 flex-col"
	onsubmit={(e) => {
		e.preventDefault();
		save();
	}}
>
	<input
		bind:value={title}
		placeholder="Заголовок"
		maxlength={200}
		class="w-full min-w-0 bg-transparent py-2 text-2xl font-bold outline-none placeholder:text-tg-hint"
	/>
	{#if note}
		<p class="mb-2 text-xs text-tg-hint">Изменено {formatNoteDate(note.updatedAt)}</p>
	{/if}
	<textarea
		bind:value={content}
		placeholder="Текст заметки, ссылки…"
		maxlength={20000}
		class="min-h-[40dvh] w-full max-w-full min-w-0 flex-1 resize-none bg-transparent py-2 text-base leading-relaxed outline-none field-sizing-content placeholder:text-tg-hint"
	></textarea>

	{#if links.length}
		<section class="mt-4">
			<h2 class="mb-2 text-xs font-semibold tracking-wide text-tg-hint uppercase">Ссылки</h2>
			<ul class="flex flex-col gap-1">
				{#each links as href (href)}
					<li>
						<button
							type="button"
							class="w-full truncate rounded-lg bg-tg-secondary-bg px-3 py-2 text-left text-sm text-tg-link"
							onclick={() => openLink(href)}>{displayUrl(href)}</button
						>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if error}
		<p class="mt-3 text-sm text-tg-destructive">{error}</p>
	{/if}

	<div class="sticky bottom-page-b mt-4 flex gap-2 pt-2">
		{#if note}
			<Button variant="destructive" class="w-24" onclick={remove}>Удалить</Button>
		{/if}
		<Button type="submit" class="flex-1" disabled={saving || empty || (note && !dirty)}>
			{saving ? 'Сохранение…' : 'Сохранить'}
		</Button>
	</div>
</form>
