<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ClassProp } from '#lib/types/props.ts';
	import { mergeClasses } from '#lib/utils/classes.ts';

	/**
	 * Поле формы с подписью сверху: общая обёртка `TextField`, `NumberField`, `DateField`,
	 * `TimeField`. Само поле (`<input class="field-filled …">`) — в `children`.
	 */
	interface Props extends ClassProp {
		label: string;
		/**
		 * Текст поверх поля, по центру, цветом подсказки; тапы проходят сквозь него в поле.
		 * Для пустых полей даты и времени: их `placeholder` iOS не показывает.
		 */
		overlay?: string;
		children: Snippet;
	}

	let { label, overlay, class: className, children }: Props = $props();
</script>

<label class={mergeClasses('flex min-w-0 flex-col gap-1', className)}>
	<span class="truncate text-xs text-tg-hint">{label}</span>
	<span class="relative block">
		{@render children()}
		{#if overlay}
			<span
				aria-hidden="true"
				class="pointer-events-none absolute inset-0 flex items-center justify-center text-tg-hint"
			>
				{overlay}
			</span>
		{/if}
	</span>
</label>
