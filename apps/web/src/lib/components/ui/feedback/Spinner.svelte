<script lang="ts">
	import { mergeClasses } from '#lib/utils/classes.ts';

	/** Крутящийся индикатор ожидания; размер — через `class` (по умолчанию `size-6`). */
	let { class: className = '' }: { class?: string } = $props();
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
