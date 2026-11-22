<script lang="ts">
	import { isInTelegram, useBackButton } from '#lib/telegram.ts';

	/**
	 * Навигация «назад» для экрана: в Telegram — системная кнопка «Назад» (пока компонент смонтирован),
	 * в обычном браузере — ссылка-кнопка «‹ label» в начале экрана.
	 */
	let { onback, label = 'Назад' }: { onback: () => void; label?: string } = $props();

	$effect(() => useBackButton(onback));
</script>

{#if !isInTelegram()}
	<button type="button" class="mb-2 self-start text-tg-link" onclick={onback}>‹ {label}</button>
{/if}
