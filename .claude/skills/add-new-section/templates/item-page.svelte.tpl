<script lang="ts">
	import __Entity__Editor from '#lib/components/__entities__/__Entity__Editor.svelte';
	import Screen from '#lib/components/ui/layout/Screen.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<Screen>
	<!-- key: при переходе между записями редактор пересоздаётся с новой локальной копией -->
	{#key data.__entity__.id}
		<__Entity__Editor __entity__={data.__entity__} />
	{/key}
</Screen>
