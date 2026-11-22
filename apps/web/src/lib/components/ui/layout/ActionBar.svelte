<script lang="ts">
	import type { Snippet } from 'svelte';
	import { mergeClasses } from '#lib/utils/classes.ts';

	/** Нижняя панель действий экрана (кнопки «Сохранить», «Удалить»…): прилипает к низу при прокрутке. */
	let { class: className, children }: { class?: string; children: Snippet } = $props();
</script>

<div class={mergeClasses('sticky bottom-page-b mt-4 flex gap-2 pt-2', className)}>
	{@render children()}
</div>
