<script lang="ts">
	import { resolve } from '$app/paths';
	import type { NoteDto } from '#lib/api.ts';
	import Card from '#lib/components/ui/layout/Card.svelte';
	import { formatShortDate } from '#lib/utils/dates.ts';

	/** В списке — только заголовок: текст открывается в редакторе. */
	let { note }: { note: NoteDto } = $props();
</script>

<Card href={resolve('/notes/[id]', { id: note.id })}>
	<div class="flex items-baseline gap-2">
		<h2 class="min-w-0 flex-1 truncate font-semibold">{note.title}</h2>
		<time class="shrink-0 text-xs text-tg-hint" datetime={note.updatedAt}>
			{formatShortDate(note.updatedAt)}
		</time>
	</div>
</Card>
