<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ClassProp } from '#lib/types/props.ts';
	import { mergeClasses } from '#lib/utils/classes.ts';

	/** Подзаголовок раздела внутри экрана: мелкий, серый, прописными («Ссылки» и т. п.). */
	interface Props extends ClassProp {
		children: Snippet;
	}

	let { class: className, children }: Props = $props();
</script>

<h2
	class={mergeClasses(
		['mb-2 text-xs font-semibold tracking-wide uppercase', 'text-tg-hint'],
		className,
	)}
>
	{@render children()}
</h2>
