<script lang="ts">
	import type { Snippet } from 'svelte';

	/** Обёртка страницы: отступы безопасных зон Telegram и ограничение ширины. */
	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<div
	class={[
		'mx-auto flex flex-col',
		'min-h-dvh w-full max-w-xl',
		// поля страницы с учётом безопасных зон Telegram
		'pt-page-t pr-page-r pb-page-b pl-page-l',
	]}
>
	{@render children()}
</div>
