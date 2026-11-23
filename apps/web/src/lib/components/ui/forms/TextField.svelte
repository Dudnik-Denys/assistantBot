<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { mergeClasses } from '#lib/utils/classes.ts';

	/**
	 * Поле ввода с видимой подписью: текст, дата и время (`type="datetime-local"`) и т. п.
	 * Остальные атрибуты (`type`, `min`, `maxlength`, `placeholder`…) и `{@attach …}` —
	 * передаются в `<input>`.
	 */
	interface Props extends HTMLInputAttributes {
		label: string;
		/** Значение; связывается через `bind:value`. */
		value?: string;
	}

	let { label, value = $bindable(''), class: className, ...rest }: Props = $props();
</script>

<label class={mergeClasses('flex flex-col gap-1', className)}>
	<span class="text-xs text-tg-hint">{label}</span>
	<input
		bind:value
		class={[
			'h-11 w-full min-w-0 rounded-xl px-3 text-base',
			'bg-field text-tg-text outline-none placeholder:text-tg-hint',
			'focus:ring-2 focus:ring-tg-button/40',
		]}
		{...rest}
	/>
</label>
