<script lang="ts">
	import type { Snippet } from 'svelte';
	import BackButton from '#lib/components/ui/buttons/BackButton.svelte';
	import type { ClassProp } from '#lib/types/props.ts';
	import { mergeClasses } from '#lib/utils/classes.ts';

	/**
	 * Шапка экрана: «Назад», заголовок и содержимое под ним (поиск). Без своего фона — под ней
	 * видно свечение страницы, поэтому не прилипает: экрану с длинным списком — `Screen fit`.
	 */
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

<header class={mergeClasses('pb-3', className)}>
	{#if onback}
		<BackButton {onback} label={backLabel} />
	{/if}
	<h1 class={['text-2xl font-bold', children && 'mb-3']}>{title}</h1>
	{@render children?.()}
</header>
