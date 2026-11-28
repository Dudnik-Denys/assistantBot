<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { TestId } from '#lib/constants/test-ids.ts';
	import { UiText } from '#lib/constants/ui-texts.ts';
	import { isInTelegram, useBackButton } from '#lib/telegram.ts';

	/**
	 * Навигация «назад» для экрана: в Telegram — системная кнопка «Назад» (пока компонент
	 * смонтирован), в обычном браузере — ссылка-кнопка «‹ label» в начале экрана. Без `onback` —
	 * в главное меню, с подписью «В меню».
	 */
	interface Props {
		onback?: () => void;
		/** Подпись ссылки в браузере (в Telegram — системная кнопка без подписи). */
		label?: string;
	}

	let { onback, label }: Props = $props();

	const back = $derived(onback ?? (() => goto(resolve('/'))));
	const text = $derived(label ?? (onback ? UiText.Back : UiText.BackToMenu));

	$effect(() => useBackButton(back));
</script>

{#if !isInTelegram()}
	<button
		type="button"
		class="mb-2 self-start text-tg-link"
		onclick={back}
		data-testid={TestId.Common.Back}
	>
		‹ {text}
	</button>
{/if}
