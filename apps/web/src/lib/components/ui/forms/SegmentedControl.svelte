<script lang="ts" generics="T extends string">
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
	}

	let { options, value = $bindable(), label, class: className }: Props = $props();
</script>

<div
	class={mergeClasses('flex gap-1 rounded-xl bg-field p-1', className)}
	role="radiogroup"
	aria-label={label}
>
	{#each options as option (option.value)}
		<button
			type="button"
			role="radio"
			aria-checked={value === option.value}
			class={[
				'min-w-0 flex-1 truncate rounded-lg px-2 py-1.5 text-sm font-medium',
				value === option.value
					? 'bg-surface text-tg-text shadow-sm shadow-elevation'
					: 'text-tg-hint',
				'transition',
			]}
			onclick={() => (value = option.value)}
		>
			{option.label}
		</button>
	{/each}
</div>
