<script lang="ts">
	import type { Snippet } from 'svelte';
	import Spinner from '#lib/components/ui/feedback/Spinner.svelte';

	/** Короткое сообщение над содержимым экрана; `pending` — со спиннером (идёт процесс). */
	let { pending = false, children }: { pending?: boolean; children: Snippet } = $props();
</script>

<div
	class={[
		'mb-2 flex items-center gap-2',
		'rounded-xl px-3 py-2 text-sm',
		'bg-tg-secondary-bg text-tg-hint',
	]}
	role="status"
>
	{#if pending}<Spinner class="size-4" />{/if}
	<span>{@render children()}</span>
</div>
