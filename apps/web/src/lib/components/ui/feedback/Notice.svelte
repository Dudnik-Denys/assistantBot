<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import Spinner from '#lib/components/ui/feedback/Spinner.svelte';

	/** Короткое сообщение над содержимым экрана («Нет связи. Пробуем снова…»). */
	interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children' | 'role'> {
		/** Идёт процесс — показать спиннер. */
		pending?: boolean;
		children: Snippet;
	}

	let { pending = false, children, ...rest }: Props = $props();
</script>

<div
	class={[
		'mb-2 flex items-center gap-2',
		'rounded-xl px-3 py-2 text-sm',
		'bg-surface text-tg-hint',
	]}
	role="status"
	{...rest}
>
	{#if pending}<Spinner class="size-4" />{/if}
	<span>{@render children()}</span>
</div>
