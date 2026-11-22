<script lang="ts">
	import type { Snippet } from 'svelte';
	import BackButton from '#lib/components/ui/buttons/BackButton.svelte';
	import { mergeClasses } from '#lib/utils/classes.ts';

	/**
	 * Шапка экрана: прилипает к верху при прокрутке, фон во всю ширину.
	 * onback — показать «Назад» (системная кнопка в Telegram, ссылка в браузере);
	 * children — то, что под заголовком (поиск, фильтры); class — дополнить или переопределить стили.
	 */
	let {
		title,
		onback,
		backLabel,
		class: className,
		children,
	}: {
		title: string;
		onback?: () => void;
		backLabel?: string;
		class?: string;
		children?: Snippet;
	} = $props();
</script>

<header
	class={mergeClasses(
		'sticky top-0 z-10',
		// фон во всю ширину: выходим за поля Screen и возвращаем их внутрь
		'-mt-page-t -mr-page-r -ml-page-l pt-page-t pr-page-r pb-3 pl-page-l',
		'bg-tg-bg',
		className,
	)}
>
	{#if onback}
		<BackButton {onback} label={backLabel} />
	{/if}
	<h1 class={['text-2xl font-bold', children && 'mb-3']}>{title}</h1>
	{@render children?.()}
</header>
