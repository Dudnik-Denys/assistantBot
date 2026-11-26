<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ClassProp } from '#lib/types/props.ts';
	import { mergeClasses } from '#lib/utils/classes.ts';

	type Variant = 'primary' | 'secondary';

	/**
	 * Круглая кнопка со значком («+», «−»): действие (`onclick`) или ссылка (`href`). Отличия
	 * между местами — снаружи: цвет — `variant`, положение, тень, скрытие при вводе — `class`
	 * (как у `FloatingButton`).
	 */
	interface Props extends ClassProp {
		/** Подпись для экранного диктора: на кнопке только значок. */
		label: string;
		/** primary — основное действие (цвет кнопки), secondary — второстепенное (на поверхности). */
		variant?: Variant;
		/** Ссылка вместо кнопки. */
		href?: string;
		onclick?: () => void;
		disabled?: boolean;
		/** Значок на кнопке. */
		children: Snippet;
	}

	let {
		label,
		variant = 'primary',
		href,
		onclick,
		disabled = false,
		class: className,
		children,
	}: Props = $props();

	const variants: Record<Variant, string> = {
		primary: 'bg-tg-button text-tg-button-text',
		secondary: 'bg-surface text-tg-button',
	};

	const classes = $derived(
		mergeClasses(
			'flex size-14 items-center justify-center rounded-full text-3xl leading-none',
			variants[variant],
			'transition active:scale-95 disabled:opacity-40',
			className,
		),
	);
</script>

{#if href}
	<a {href} aria-label={label} {onclick} class={classes}>{@render children()}</a>
{:else}
	<button type="button" aria-label={label} {disabled} {onclick} class={classes}>
		{@render children()}
	</button>
{/if}
