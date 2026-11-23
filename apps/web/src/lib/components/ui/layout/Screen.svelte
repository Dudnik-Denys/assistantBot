<script lang="ts">
	import type { Snippet } from 'svelte';

	/** Обёртка страницы: отступы безопасных зон Telegram и ограничение ширины. */
	interface Props {
		/**
		 * Экран ровно по высоте окна: страница не прокручивается, прокручивается `ScrollArea`
		 * внутри, а шапка над ним стоит на месте. Нужно, если в шапке поле ввода (при прокрутке
		 * всей страницы iOS рисует каретку мимо поля) или список может быть длинным (`PageHeader`
		 * без фона и не прилипает).
		 */
		fit?: boolean;
		children: Snippet;
	}

	let { fit = false, children }: Props = $props();
</script>

<div
	class={[
		'mx-auto flex flex-col',
		fit ? 'h-dvh' : 'min-h-dvh',
		'w-full max-w-xl',
		// поля страницы с учётом безопасных зон Telegram
		'pt-page-t pr-page-r pb-page-b pl-page-l',
	]}
>
	{@render children()}
</div>
