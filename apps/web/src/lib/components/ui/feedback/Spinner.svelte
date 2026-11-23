<script lang="ts">
	import type { ClassProp } from '#lib/types/props.ts';
	import { mergeClasses } from '#lib/utils/classes.ts';

	/** Крутящийся индикатор ожидания; размер — через `class` (по умолчанию `size-6`). */
	type Props = ClassProp;

	let { class: className = '' }: Props = $props();
</script>

<span
	class={mergeClasses(
		[
			'inline-block shrink-0',
			'size-6 rounded-full border-2',
			'border-tg-hint/30 border-t-tg-button',
			'animate-spin',
		],
		className,
	)}
	aria-hidden="true"
></span>
