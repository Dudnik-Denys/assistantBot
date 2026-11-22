<script lang="ts">
	import NoteEditor from '#lib/components/notes/NoteEditor.svelte';
	import Screen from '#lib/components/ui/layout/Screen.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<Screen>
	<!-- key: при переходе между заметками редактор пересоздаётся с новой локальной копией -->
	{#key data.note.id}
		<NoteEditor note={data.note} />
	{/key}
</Screen>
