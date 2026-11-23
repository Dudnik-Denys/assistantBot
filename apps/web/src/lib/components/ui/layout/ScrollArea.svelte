<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ClassProp } from '#lib/types/props.ts';
	import { mergeClasses } from '#lib/utils/classes.ts';

	/**
	 * Прокручиваемая часть экрана под шапкой — только внутри `<Screen fit>`. Прокручивается она,
	 * а не вся страница: шапка с полем ввода стоит на месте, и iOS не рисует каретку мимо поля.
	 */
	interface Props extends ClassProp {
		children: Snippet;
	}

	let { class: className, children }: Props = $props();
</script>

<div
	class={mergeClasses('flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain', className)}
>
	{@render children()}
</div>
