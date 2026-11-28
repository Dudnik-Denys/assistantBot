<script lang="ts">
	import { NOTE_CONTENT_MAX, NOTE_TITLE_MAX } from '@tgab/core/constants/notes';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { api, type NoteDto } from '#lib/api.ts';
	import BackButton from '#lib/components/ui/buttons/BackButton.svelte';
	import SectionTitle from '#lib/components/ui/text/SectionTitle.svelte';
	import { NoteEditorText } from '#lib/constants/notes.ts';
	import { TestId } from '#lib/constants/test-ids.ts';
	import { focusField } from '#lib/keyboard.ts';
	import { Autosave } from '#lib/reactive/autosave.svelte.ts';
	import { confirmDialog, openLink } from '#lib/telegram.ts';
	import { formatShortDate } from '#lib/utils/dates.ts';
	import { displayUrl, linkify } from '#lib/utils/linkify.ts';

	/**
	 * Редактор заметки без кнопок и без индикатора сохранения, как в Заметках iOS: изменения
	 * сохраняются сами (Autosave), если есть заголовок; под ним — время последнего изменения.
	 */
	interface Props {
		/** Заметка для изменения; нет — новая: создаётся при первом сохранении, дальше обновляется. */
		note?: NoteDto;
	}

	let { note }: Props = $props();

	// Редактор держит локальную копию; исходная заметка нужна только для начальных значений.
	// svelte-ignore state_referenced_locally
	let title = $state(note?.title ?? '');
	// svelte-ignore state_referenced_locally
	let content = $state(note?.content ?? '');
	// svelte-ignore state_referenced_locally
	let noteId = note?.id;
	/** Время последнего изменения — из ответа сервера после каждого сохранения. */
	// svelte-ignore state_referenced_locally
	let updatedAt = $state(note?.updatedAt);

	const empty = $derived(!title.trim() && !content.trim());
	/** Заголовок обязателен (NoteInputSchema) — без него не сохранить. */
	const untitled = $derived(!title.trim());
	const links = $derived([
		...new Set(
			linkify(content).flatMap((segment) => (segment.type === 'link' ? [segment.href] : [])),
		),
	]);

	const autosave = new Autosave({
		value: () => ({ title, content }),
		canSave: (draft) => draft.title.trim() !== '',
		save: async (draft) => {
			if (noteId) {
				updatedAt = (await api.notes.update(noteId, draft)).updatedAt;
			} else {
				const created = await api.notes.create(draft);
				noteId = created.id;
				updatedAt = created.updatedAt;
				// Адрес созданной заметки вместо /notes/new — без перехода (редактор и фокус остаются),
				// чтобы перезагрузка страницы не создала заметку заново. Только если мы ещё здесь:
				// сохранение могло завершиться уже после ухода на другую страницу.
				if (page.url.pathname === resolve('/notes/new')) {
					void goto(resolve('/notes/[id]', { id: noteId }), { shallow: true, replace: true });
				}
			}
		},
	});

	/** Новая заметка — сразу фокус в заголовок; существующая открывается без клавиатуры. */
	function focusIfNew(input: HTMLInputElement) {
		if (!note) focusField(input);
	}

	async function back() {
		const saved = await autosave.flush();
		if (!saved && !empty) {
			const message = untitled ? NoteEditorText.LeaveUntitled : NoteEditorText.LeaveUnsaved;
			if (!(await confirmDialog(message))) return;
		}
		goto(resolve('/notes'));
	}
</script>

<BackButton onback={back} />

<div class="flex flex-1 flex-col">
	<!-- Заголовок страницы для экранного диктора: видимый заголовок — само поле ввода. -->
	<h1 class="sr-only">{title.trim() || 'Новая заметка'}</h1>
	<input
		{@attach focusIfNew}
		bind:value={title}
		aria-label="Заголовок"
		placeholder="Заголовок"
		maxlength={NOTE_TITLE_MAX}
		class="field-bare text-2xl font-bold"
		data-testid={TestId.NoteEditor.Title}
	/>
	<p class="mb-2 min-h-4 text-xs text-tg-hint" data-testid={TestId.NoteEditor.Hint}>
		{#if untitled && !empty}
			{NoteEditorText.UntitledHint}
		{:else if autosave.error}
			<span class="text-tg-destructive">{autosave.error}</span>
		{:else if updatedAt}
			Изменено {formatShortDate(updatedAt)}
		{/if}
	</p>
	<textarea
		bind:value={content}
		aria-label="Текст заметки"
		placeholder="Текст заметки, ссылки…"
		data-testid={TestId.NoteEditor.Content}
		maxlength={NOTE_CONTENT_MAX}
		class={[
			'field-bare flex-1',
			// растёт по содержимому, но не ниже 40% экрана
			'field-sizing-content min-h-[40dvh] resize-none',
			'text-base leading-relaxed',
		]}></textarea>

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
								'bg-surface text-tg-link',
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
</div>
