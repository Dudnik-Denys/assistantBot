<script lang="ts">
	import type { NoteDto } from '#lib/api.ts';
	import { formatNoteDate } from '#lib/format.ts';
	import Linkified from './Linkified.svelte';

	let { note }: { note: NoteDto } = $props();
</script>

<a
	href="/notes/{note.id}"
	class="block rounded-2xl bg-tg-secondary-bg px-4 py-3 transition active:opacity-70"
>
	<div class="flex items-baseline gap-2">
		<h2 class="min-w-0 flex-1 truncate font-semibold">
			{note.title || note.content.split('\n', 1)[0]}
		</h2>
		<time class="shrink-0 text-xs text-tg-hint" datetime={note.updatedAt}>
			{formatNoteDate(note.updatedAt)}
		</time>
	</div>
	{#if note.title && note.content}
		<p class="mt-1 line-clamp-3 text-sm wrap-break-word whitespace-pre-line text-tg-hint">
			<Linkified text={note.content} interactive={false} />
		</p>
	{/if}
</a>
