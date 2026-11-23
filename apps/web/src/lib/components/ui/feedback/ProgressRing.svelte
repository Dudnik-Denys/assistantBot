<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ClassProp } from '#lib/types/props.ts';
	import { mergeClasses } from '#lib/utils/classes.ts';

	/** Круговой прогресс: кольцо заполняется по часовой стрелке, в центре — `children`. */
	interface Props extends ClassProp {
		/** Доля от 0 до 1. */
		progress: number;
		/** Подпись для экранного диктора («Прошло 40% цикла»). */
		label: string;
		children?: Snippet;
	}

	let { progress, label, class: className, children }: Props = $props();

	// pathLength=100: длина окружности — 100 единиц, заполнение — прямо в процентах.
	const percent = $derived(Math.round(Math.min(1, Math.max(0, progress)) * 100));
</script>

<div
	class={mergeClasses('relative flex aspect-square items-center justify-center', className)}
	role="progressbar"
	aria-label={label}
	aria-valuemin={0}
	aria-valuemax={100}
	aria-valuenow={percent}
>
	<svg class="absolute inset-0 size-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
		<circle cx="50" cy="50" r="45" fill="none" stroke-width="6" class="stroke-tg-hint/20" />
		<circle
			cx="50"
			cy="50"
			r="45"
			fill="none"
			stroke-width="6"
			stroke-linecap="round"
			pathLength="100"
			stroke-dasharray="100"
			class={[
				'stroke-tg-button',
				// незаполненная часть — сдвиг штриха на (100 − процент)
				'[stroke-dashoffset:calc(100-var(--ring-percent))]',
				'transition-[stroke-dashoffset] duration-1000 ease-linear',
			]}
			style:--ring-percent={percent}
		/>
	</svg>
	<div class="relative flex flex-col items-center text-center">{@render children?.()}</div>
</div>
