<script lang="ts">
	import { resolve } from '$app/paths';
	import type { NoteDto } from '#lib/api.ts';
	import Card from '#lib/components/ui/layout/Card.svelte';
	import Linkified from '#lib/components/ui/text/Linkified.svelte';
	import { formatShortDate } from '#lib/utils/dates.ts';

	let { note }: { note: NoteDto } = $props();
</script>

<Card href={resolve('/notes/[id]', { id: note.id })}>
	<div class="flex items-baseline gap-2">
		<h2 class="min-w-0 flex-1 truncate font-semibold">
			{note.title || note.content.split('\n', 1)[0]}
		</h2>
		<time class="shrink-0 text-xs text-tg-hint" datetime={note.updatedAt}>
			{formatShortDate(note.updatedAt)}
		</time>
	</div>
	{#if note.title && note.content}
		<p class="mt-1 line-clamp-3 text-sm wrap-break-word whitespace-pre-line text-tg-hint">
			<Linkified text={note.content} interactive={false} />
		</p>
	{/if}
</Card>
