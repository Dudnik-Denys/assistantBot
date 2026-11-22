<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes } from 'svelte/elements';
	import { mergeClasses } from '#lib/utils/classes.ts';

	/**
	 * Карточка-ссылка: пункт меню, элемент списка. Общий фон, скругление, отклик на нажатие.
	 * class снаружи дополняет и переопределяет базовые стили через mergeClasses() (например, `class="flex gap-3"`).
	 */
	let {
		href,
		children,
		class: className,
		...rest
	}: HTMLAnchorAttributes & { href: string; children: Snippet } = $props();
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
