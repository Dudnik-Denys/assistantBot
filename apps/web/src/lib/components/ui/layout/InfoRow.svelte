<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ClassProp } from '#lib/types/props.ts';
	import { mergeClasses } from '#lib/utils/classes.ts';

	/** Строка «подпись — значение» в `Panel`: подпись приглушённая слева, значение справа. */
	interface Props extends ClassProp {
		label: string;
		/** Значение: текст или разметка. */
		children: Snippet;
	}

	let { label, class: className, children }: Props = $props();
</script>

<p class={mergeClasses('flex justify-between gap-2', className)}>
	<span class="text-tg-hint">{label}</span>
	<span>{@render children()}</span>
</p>
