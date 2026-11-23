<script lang="ts">
	import { resolve } from '$app/paths';
	import type { NoteDto } from '#lib/api.ts';
	import Card from '#lib/components/ui/layout/Card.svelte';
	import SwipeActions from '#lib/components/ui/layout/SwipeActions.svelte';
	import { formatShortDate } from '#lib/utils/dates.ts';

	/** Заметка в списке: только заголовок (текст — в редакторе); свайп влево — «Удалить». */
	interface Props {
		note: NoteDto;
		/** Спросить подтверждение и удалить; строка закрывается, когда промис завершится. */
		onremove: () => Promise<void>;
	}

	let { note, onremove }: Props = $props();
</script>

<SwipeActions>
	<Card href={resolve('/notes/[id]', { id: note.id })} draggable={false}>
		<div class="flex items-baseline gap-2">
			<h2 class="min-w-0 flex-1 truncate font-semibold">{note.title}</h2>
			<time class="shrink-0 text-xs text-tg-hint" datetime={note.updatedAt}>
				{formatShortDate(note.updatedAt)}
			</time>
		</div>
	</Card>

	{#snippet actions(close)}
		<button
			type="button"
			class="w-24 bg-tg-destructive font-semibold text-on-destructive"
			onclick={async () => {
				await onremove();
				close();
			}}
		>
			Удалить
		</button>
	{/snippet}
</SwipeActions>
