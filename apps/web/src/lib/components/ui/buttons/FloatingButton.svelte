<script lang="ts">
	import type { Snippet } from 'svelte';
	import RoundButton from '#lib/components/ui/buttons/RoundButton.svelte';
	import { TestId } from '#lib/constants/test-ids.ts';
	import { haptic } from '#lib/telegram.ts';

	/**
	 * Круглая плавающая кнопка-ссылка в правом нижнем углу экрана: «+» для новой записи и т. п.
	 * `RoundButton`, закреплённая в углу и скрытая при вводе.
	 */
	interface Props {
		href: string;
		/** Подпись для экранного диктора: на кнопке только значок. */
		label: string;
		/** Значок на кнопке («+»). */
		children: Snippet;
		/** Касание кнопки, до перехода по ссылке (например, `holdKeyboard`). */
		onopen?: () => void;
	}

	let { href, label, children, onopen }: Props = $props();

	/**
	 * Закреплена в правом нижнем углу; при открытой клавиатуре висела бы над ней — прячется,
	 * пока поле в фокусе (`typing:`).
	 */
	const FLOATING_CLASSES =
		'fixed right-page-r bottom-page-b shadow-lg shadow-elevation typing:pointer-events-none typing:opacity-0';
</script>

<RoundButton
	{href}
	{label}
	onclick={() => {
		haptic('light');
		onopen?.();
	}}
	class={FLOATING_CLASSES}
	data-testid={TestId.Common.FloatingButton}
>
	{@render children()}
</RoundButton>
