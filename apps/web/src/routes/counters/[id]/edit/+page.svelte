<script lang="ts">
	import CounterForm from '#lib/components/counters/CounterForm.svelte';
	import Screen from '#lib/components/ui/layout/Screen.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<Screen>
	{#key data.counter.id}
		<CounterForm counter={data.counter} />
	{/key}
</Screen>
