<script lang="ts">
	import type { Snippet } from 'svelte';

	/** Состояние экрана вместо содержимого: загрузка, пусто, ничего не найдено, ошибка. */
	interface Props {
		title: string;
		/** Простой текст под заголовком; пустой не выводится. */
		text?: string;
		/** Мелкая подпись внизу (код ошибки и т. п.). */
		caption?: string;
		/** error — экранный диктор объявляет сразу (role="alert"), info — вежливо (role="status"). */
		tone?: 'info' | 'error';
		/** Уровень заголовка: 1 — сообщение одно на странице, 2 — внутри экрана со своим заголовком. */
		level?: 1 | 2;
		/** Над заголовком (например, Spinner). */
		icon?: Snippet;
		/** Вместо `text`, если нужна разметка. */
		children?: Snippet;
	}

	let { title, text, caption, tone = 'info', level = 2, icon, children }: Props = $props();
</script>

<div
	class="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-16 text-center"
	role={tone === 'error' ? 'alert' : 'status'}
>
	{#if icon}
		<div class="mb-2">{@render icon()}</div>
	{/if}
	<svelte:element this={`h${level}`} class="text-lg font-semibold">{title}</svelte:element>
	{#if children}
		<div class="text-sm text-tg-hint">{@render children()}</div>
	{:else if text}
		<p class="text-sm text-tg-hint">{text}</p>
	{/if}
	{#if caption}
		<p class="text-xs text-tg-hint">{caption}</p>
	{/if}
</div>
