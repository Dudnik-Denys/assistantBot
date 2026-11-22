<script lang="ts">
	import type { Snippet } from 'svelte';
	import { mergeClasses } from '#lib/utils/classes.ts';

	/** Подзаголовок раздела внутри экрана: мелкий, серый, прописными («Ссылки» и т. п.). */
	let { class: className, children }: { class?: string; children: Snippet } = $props();
</script>

<h2
	class={mergeClasses('mb-2 text-xs font-semibold tracking-wide text-tg-hint uppercase', className)}
>
	{@render children()}
</h2>
