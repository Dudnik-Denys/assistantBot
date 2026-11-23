<script lang="ts">
	import { NOTE_CONTENT_MAX, NOTE_TITLE_MAX } from '@tgab/core/constants/notes';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { api, type NoteDto } from '#lib/api.ts';
	import BackButton from '#lib/components/ui/buttons/BackButton.svelte';
	import SectionTitle from '#lib/components/ui/text/SectionTitle.svelte';
	import { Autosave } from '#lib/reactive/autosave.svelte.ts';
	import { confirmDialog, openLink } from '#lib/telegram.ts';
	import { formatShortDate } from '#lib/utils/dates.ts';
	import { displayUrl, linkify } from '#lib/utils/linkify.ts';

	/**
	 * Редактор заметки без кнопок и без индикатора сохранения, как в Заметках iOS: изменения
	 * сохраняются сами (Autosave), если есть заголовок; под ним — время последнего изменения.
	 */
	let { note }: { note?: NoteDto } = $props();

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
		...new Set(linkify(content).flatMap((s) => (s.type === 'link' ? [s.href] : []))),
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

	async function back() {
		const saved = await autosave.flush();
		if (!saved && !empty) {
			const message = untitled
				? 'Заметка без заголовка не сохранится. Выйти?'
				: 'Не удалось сохранить изменения. Выйти?';
			if (!(await confirmDialog(message))) return;
		}
		goto(resolve('/notes'));
	}
</script>

<BackButton onback={back} />

<div class="flex flex-1 flex-col">
	<input
		bind:value={title}
		placeholder="Заголовок"
		maxlength={NOTE_TITLE_MAX}
		class="field-bare text-2xl font-bold"
	/>
	<p class="mb-2 min-h-4 text-xs text-tg-hint">
		{#if untitled && !empty}
			Укажите заголовок — без него заметка не сохранится
		{:else if autosave.error}
			<span class="text-tg-destructive">{autosave.error}</span>
		{:else if updatedAt}
			Изменено {formatShortDate(updatedAt)}
		{/if}
	</p>
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
</div>
