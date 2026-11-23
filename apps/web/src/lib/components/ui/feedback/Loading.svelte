<script lang="ts">
	import Message from '#lib/components/ui/feedback/Message.svelte';
	import Spinner from '#lib/components/ui/feedback/Spinner.svelte';
	import { DelayedFlag } from '#lib/reactive/delayed-flag.svelte.ts';

	/** Задержка перед показом: быстрый ответ приходит раньше, и индикатор не мелькает. */
	const SHOW_DELAY_MS = 300;

	/** «Загрузка…» со спиннером — появляется только если ответ задерживается. */
	interface Props {
		/** Текст под спиннером («Идёт попытка соединения…» и т. п.). */
		title?: string;
	}

	let { title = 'Загрузка…' }: Props = $props();

	const visible = new DelayedFlag(() => true, SHOW_DELAY_MS);
</script>

{#if visible.value}
	<Message {title}>
		{#snippet icon()}<Spinner />{/snippet}
	</Message>
{/if}
