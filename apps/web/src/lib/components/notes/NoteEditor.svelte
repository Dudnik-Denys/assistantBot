<script lang="ts">
	import { NOTE_CONTENT_MAX, NOTE_TITLE_MAX } from '@tgab/core/constants/notes';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { api, type NoteDto } from '#lib/api.ts';
	import BackButton from '#lib/components/ui/buttons/BackButton.svelte';
	import Button from '#lib/components/ui/buttons/Button.svelte';
	import ActionBar from '#lib/components/ui/layout/ActionBar.svelte';
	import SectionTitle from '#lib/components/ui/text/SectionTitle.svelte';
	import { errorMessage } from '#lib/errors.ts';
	import { confirmDialog, haptic, openLink } from '#lib/telegram.ts';
	import { formatShortDate } from '#lib/utils/dates.ts';
	import { displayUrl, linkify } from '#lib/utils/linkify.ts';

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
		...new Set(linkify(content).flatMap((s) => (s.type === 'link' ? [s.href] : []))),
	]);

	async function back() {
		if (dirty && !empty && !(await confirmDialog('Выйти без сохранения изменений?'))) return;
		goto(resolve('/notes'));
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
			goto(resolve('/notes'));
		} catch (e) {
			haptic('error');
			error = errorMessage(e);
		} finally {
			saving = false;
		}
	}

	async function remove() {
		if (!note || !(await confirmDialog('Удалить заметку?'))) return;
		try {
			await api.notes.remove(note.id);
			haptic('warning');
			goto(resolve('/notes'));
		} catch (e) {
			error = errorMessage(e);
		}
	}

	function onKeydown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') save();
	}
</script>

<svelte:window onkeydown={onKeydown} />

<BackButton onback={back} />

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
		maxlength={NOTE_TITLE_MAX}
		class="field-bare text-2xl font-bold"
	/>
	{#if note}
		<p class="mb-2 text-xs text-tg-hint">Изменено {formatShortDate(note.updatedAt)}</p>
	{/if}
	<textarea
		bind:value={content}
		placeholder="Текст заметки, ссылки…"
		maxlength={NOTE_CONTENT_MAX}
		class="field-sizing-content min-h-[40dvh] field-bare flex-1 resize-none text-base leading-relaxed"
	></textarea>

	{#if links.length}
		<section class="mt-4">
			<SectionTitle>Ссылки</SectionTitle>
			<ul class="flex flex-col gap-1">
				{#each links as href (href)}
					<li>
						<button
							type="button"
							class={[
								'w-full truncate rounded-lg px-3 py-2 text-left text-sm',
								'bg-tg-secondary-bg text-tg-link',
							]}
							onclick={() => openLink(href)}
						>
							{displayUrl(href)}
						</button>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if error}
		<p class="mt-3 text-sm text-tg-destructive">{error}</p>
	{/if}

	<ActionBar>
		{#if note}
			<Button variant="destructive" class="w-24" onclick={remove}>Удалить</Button>
		{/if}
		<Button type="submit" class="flex-1" disabled={saving || empty || (note && !dirty)}>
			{saving ? 'Сохранение…' : 'Сохранить'}
		</Button>
	</ActionBar>
</form>
