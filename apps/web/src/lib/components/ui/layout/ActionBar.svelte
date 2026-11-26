<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ClassProp } from '#lib/types/props.ts';
	import { mergeClasses } from '#lib/utils/classes.ts';

	/**
	 * Нижняя панель действий экрана (кнопки `Button`): прилипает к низу при прокрутке;
	 * `class="static"` — обычный последний элемент (кнопка формы, `CounterForm`). Пока открыта
	 * клавиатура (`typing:`), скрыта: прилипшая, она встаёт над клавиатурой поверх полей.
	 */
	interface Props extends ClassProp {
		children: Snippet;
	}

	let { class: className, children }: Props = $props();
</script>

<div class={mergeClasses('sticky bottom-page-b mt-4 flex gap-2 pt-2 typing:hidden', className)}>
	{@render children()}
</div>
