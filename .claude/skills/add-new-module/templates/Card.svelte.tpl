<script lang="ts">
	import { resolve } from '$app/paths';
	import type { __Entity__Dto } from '#lib/api.ts';
	import Card from '#lib/components/ui/layout/Card.svelte';
	import { formatShortDate } from '#lib/utils/dates.ts';

	let { __entity__ }: { __entity__: __Entity__Dto } = $props();
</script>

<Card href={resolve('/__entities__/[id]', { id: __entity__.id })}>
	<div class="flex items-baseline gap-2">
		<h2 class="min-w-0 flex-1 truncate font-semibold">{__entity__.title}</h2>
		<time class="shrink-0 text-xs text-tg-hint" datetime={__entity__.updatedAt}>
			{formatShortDate(__entity__.updatedAt)}
		</time>
	</div>
</Card>
