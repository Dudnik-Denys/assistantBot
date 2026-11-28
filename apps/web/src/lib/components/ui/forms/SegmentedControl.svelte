<script lang="ts" generics="T extends string">
	import { testIdWithValue } from '#lib/constants/test-ids.ts';
	import type { ClassProp } from '#lib/types/props.ts';
	import { mergeClasses } from '#lib/utils/classes.ts';

	/** Один вариант переключателя. */
	interface Option {
		value: T;
		label: string;
	}

	/** Выбор одного варианта из нескольких кнопками в ряд: вкладки списка, режим формы. */
	interface Props extends ClassProp {
		options: readonly Option[];
		/** Выбранное значение; связывается через `bind:value`. */
		value: T;
		/** Подпись группы для экранного диктора. */
		label: string;
		/** `data-testid` вариантов: у каждого — `testIdWithValue(testId, value)`. */
		testId?: string;
	}

	let { options, value = $bindable(), label, testId, class: className }: Props = $props();
</script>

<!--
	Колонки сетки равные, но не уже своей подписи (подпись не переносится и не обрезается):
	помещаются все — сегменты одной ширины, не помещается длинная — шире только она. Именно
	`auto-cols-[1fr]` (= minmax(auto, 1fr)), а не `auto-cols-fr`: тот в Tailwind — minmax(0, 1fr),
	и длинная подпись вылезала бы за свой сегмент.
	Подписи держать короткими: иначе ряд не поместится в ширину экрана.
-->
<div
	class={mergeClasses(
		'grid auto-cols-[1fr] grid-flow-col gap-1 overflow-hidden rounded-xl bg-field p-1',
		className,
	)}
	role="radiogroup"
	aria-label={label}
>
	{#each options as option (option.value)}
		<button
			type="button"
			role="radio"
			aria-checked={value === option.value}
			data-testid={testId && testIdWithValue(testId, option.value)}
			class={[
				'rounded-lg px-2 py-1.5 text-sm font-medium whitespace-nowrap',
				value === option.value
					? 'bg-surface text-tg-text shadow-sm shadow-elevation'
					: 'text-tg-hint',
				'transition motion-reduce:transition-none',
			]}
			onclick={() => (value = option.value)}
		>
			{option.label}
		</button>
	{/each}
</div>
