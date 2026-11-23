<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ClassProp } from '#lib/types/props.ts';
	import { mergeClasses } from '#lib/utils/classes.ts';

	/**
	 * Блок на странице без перехода (в отличие от `Card`-ссылки): группа полей формы,
	 * сведения на экране записи. Фон `bg-surface`, скругление — как у `Card`.
	 */
	interface Props extends ClassProp {
		children: Snippet;
	}

	let { class: className, children }: Props = $props();
</script>

<div class={mergeClasses('flex flex-col gap-3 rounded-2xl bg-surface px-4 py-3', className)}>
	{@render children()}
</div>
