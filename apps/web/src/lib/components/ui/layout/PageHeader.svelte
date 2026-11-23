<script lang="ts">
	import type { Snippet } from 'svelte';
	import BackButton from '#lib/components/ui/buttons/BackButton.svelte';
	import type { ClassProp } from '#lib/types/props.ts';
	import { mergeClasses } from '#lib/utils/classes.ts';

	/** Шапка экрана: прилипает к верху при прокрутке, фон во всю ширину. */
	interface Props extends ClassProp {
		title: string;
		/** Показать «Назад»: системная кнопка в Telegram, ссылка в браузере. */
		onback?: () => void;
		/** Подпись ссылки «Назад» в браузере. */
		backLabel?: string;
		/** Под заголовком: поиск, фильтры. */
		children?: Snippet;
	}

	let { title, onback, backLabel, class: className, children }: Props = $props();
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
