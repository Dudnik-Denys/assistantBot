<script lang="ts">
	import type { ClassProp } from '#lib/types/props.ts';
	import { mergeClasses } from '#lib/utils/classes.ts';

	/** Короткое поле для целого числа с подписью сверху: части срока (месяцы, дни…). */
	interface Props extends ClassProp {
		label: string;
		/** Значение; пустое поле — 0. Связывается через `bind:value`. */
		value: number;
		min?: number;
		max?: number;
	}

	let { label, value = $bindable(), min = 0, max, class: className }: Props = $props();

	/** Пустое поле — 0, дробное — целое, вне пределов — ближайшая граница. */
	function normalize(raw: number | null | undefined): number {
		const whole = Math.trunc(raw ?? 0);
		const atLeastMin = Math.max(min, Number.isFinite(whole) ? whole : 0);
		return max === undefined ? atLeastMin : Math.min(max, atLeastMin);
	}
</script>

<label class={mergeClasses('flex min-w-0 flex-col gap-1', className)}>
	<span class="truncate text-xs text-tg-hint">{label}</span>
	<input
		type="number"
		inputmode="numeric"
		{min}
		{max}
		bind:value={() => value || null, (raw) => (value = normalize(raw))}
		placeholder="0"
		class={[
			'h-11 w-full min-w-0 rounded-xl px-2 text-center text-base',
			'bg-field text-tg-text outline-none placeholder:text-tg-hint',
			'focus:ring-2 focus:ring-tg-button/40',
		]}
	/>
</label>
