<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { mergeClasses } from '#lib/utils/classes.ts';

	type Variant = 'primary' | 'secondary' | 'destructive';

	/** Кнопка действия; остальные атрибуты (`onclick`, `disabled`, `class`…) — как у `<button>`. */
	interface Props extends HTMLButtonAttributes {
		/** primary — основное действие, secondary — второстепенное, destructive — удаление. */
		variant?: Variant;
		children: Snippet;
	}

	let { variant = 'primary', children, class: className, ...rest }: Props = $props();

	const variants: Record<Variant, string> = {
		primary: 'bg-tg-button text-tg-button-text',
		secondary: 'bg-surface text-tg-text',
		destructive: 'bg-tg-destructive text-on-destructive',
	};
</script>

<button
	type="button"
	class={mergeClasses(
		'flex items-center justify-center',
		'h-12 rounded-xl px-4 text-base font-semibold',
		'transition active:scale-[0.98] active:opacity-80',
		'disabled:opacity-40 disabled:active:scale-100',
		variants[variant],
		className,
	)}
	{...rest}
>
	{@render children()}
</button>
