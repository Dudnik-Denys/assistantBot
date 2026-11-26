<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import Field from '#lib/components/ui/forms/Field.svelte';
	import type { ClassProp } from '#lib/types/props.ts';
	import { formatPlainTime, parsePlainTime, type Temporal } from '#lib/utils/temporal.ts';

	/**
	 * Поле времени с подписью: по тапу — системный выбор часов и минут. Остальные атрибуты
	 * (`required`, `disabled`…) передаются в `<input>`.
	 */
	interface Props
		extends Omit<HTMLInputAttributes, 'type' | 'value' | 'placeholder' | 'class'>, ClassProp {
		label: string;
		/** Время без даты (до минуты); null — поле пустое. Связывается через `bind:value`. */
		value: Temporal.PlainTime | null;
		/** Текст пустого поля. */
		placeholder?: string;
	}

	let {
		label,
		value = $bindable(),
		placeholder = '–',
		class: className,
		...rest
	}: Props = $props();
</script>

<Field {label} overlay={value ? undefined : placeholder} class={className}>
	<!-- iOS рисует системное поле времени со своей минимальной шириной, которая сильнее `w-full`, и
	поле вылезает из колонки; без системного вида (`appearance-none`) оно занимает заданную ширину. -->
	<input
		type="time"
		bind:value={() => (value ? formatPlainTime(value) : ''), (raw) => (value = parsePlainTime(raw))}
		class="field-filled appearance-none px-2 text-center"
		{...rest}
	/>
</Field>
