<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes } from 'svelte/elements';
	import { mergeClasses } from '#lib/utils/classes.ts';

	/**
	 * Карточка-ссылка: пункт меню, элемент списка. Общий фон, скругление, отклик на нажатие.
	 * Остальные атрибуты — как у `<a>`; `class` объединяется с базовыми через mergeClasses()
	 * (например, `class="flex gap-3"`).
	 */
	interface Props extends HTMLAnchorAttributes {
		href: string;
		children: Snippet;
	}

	let { href, children, class: className, ...rest }: Props = $props();
</script>

<a
	{href}
	class={mergeClasses(
		'block rounded-2xl bg-tg-secondary-bg px-4 py-3 transition active:opacity-70',
		className,
	)}
	{...rest}
>
	{@render children()}
</a>
