<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import Field from '#lib/components/ui/forms/Field.svelte';
	import { UiText } from '#lib/constants/ui-texts.ts';
	import type { ClassProp } from '#lib/types/props.ts';
	import { parsePlainDate, type Temporal } from '#lib/utils/temporal.ts';

	/**
	 * Поле даты с подписью: по тапу — системный календарь. Остальные атрибуты (`required`,
	 * `disabled`…) передаются в `<input>`.
	 */
	interface Props
		extends
			Omit<HTMLInputAttributes, 'type' | 'value' | 'min' | 'max' | 'placeholder' | 'class'>,
			ClassProp {
		label: string;
		/** Дата без времени; null — поле пустое. Связывается через `bind:value`. */
		value: Temporal.PlainDate | null;
		/** Раньше этой даты выбрать нельзя. */
		min?: Temporal.PlainDate;
		/** Текст пустого поля. */
		placeholder?: string;
	}

	let {
		label,
		value = $bindable(),
		min,
		placeholder = UiText.EmptyValue,
		class: className,
		...rest
	}: Props = $props();
</script>

<Field {label} overlay={value ? undefined : placeholder} class={className}>
	<!-- iOS рисует системное поле даты со своей минимальной шириной, которая сильнее `w-full`, и поле
	вылезает из колонки; без системного вида (`appearance-none`) оно занимает заданную ширину. -->
	<input
		type="date"
		bind:value={() => value?.toString() ?? '', (raw) => (value = parsePlainDate(raw))}
		min={min?.toString()}
		class="field-filled appearance-none px-2 text-center"
		{...rest}
	/>
</Field>
