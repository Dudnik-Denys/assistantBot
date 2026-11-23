<script lang="ts">
	import CounterView from '#lib/components/counters/CounterView.svelte';
	import Screen from '#lib/components/ui/layout/Screen.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<Screen>
	{#key data.counter.id}
		<CounterView counter={data.counter} />
	{/key}
</Screen>
