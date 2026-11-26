<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import Field from '#lib/components/ui/forms/Field.svelte';
	import type { ClassProp } from '#lib/types/props.ts';

	/**
	 * Поле ввода текста с видимой подписью. Дата и время — `DateField` и `TimeField`.
	 * Остальные атрибуты (`type`, `min`, `maxlength`, `placeholder`…) и `{@attach …}` —
	 * передаются в `<input>`.
	 */
	interface Props extends Omit<HTMLInputAttributes, 'class'>, ClassProp {
		label: string;
		/** Значение; связывается через `bind:value`. */
		value?: string;
	}

	let { label, value = $bindable(''), class: className, ...rest }: Props = $props();
</script>

<Field {label} class={className}>
	<input bind:value class="field-filled px-3" {...rest} />
</Field>
