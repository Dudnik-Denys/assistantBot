<script lang="ts">
	import Field from '#lib/components/ui/forms/Field.svelte';
	import type { ClassProp } from '#lib/types/props.ts';

	/** Короткое поле для целого числа с подписью сверху: части срока (месяцы, дни…). */
	interface Props extends ClassProp {
		label: string;
		/** Значение; пустое поле — 0. Связывается через `bind:value`. */
		value: number;
		min?: number;
		max?: number;
		/** Текст пустого поля (значение 0). */
		placeholder?: string;
	}

	let {
		label,
		value = $bindable(),
		min = 0,
		max,
		placeholder = '–',
		class: className,
	}: Props = $props();

	/** Пустое поле — 0, дробное — целое, вне пределов — ближайшая граница. */
	function normalize(raw: number | null | undefined): number {
		const whole = Math.trunc(raw ?? 0);
		const atLeastMin = Math.max(min, Number.isFinite(whole) ? whole : 0);
		return max === undefined ? atLeastMin : Math.min(max, atLeastMin);
	}
</script>

<Field {label} class={className}>
	<input
		type="number"
		inputmode="numeric"
		{min}
		{max}
		bind:value={() => value || null, (raw) => (value = normalize(raw))}
		{placeholder}
		class="field-filled px-2 text-center"
	/>
</Field>
