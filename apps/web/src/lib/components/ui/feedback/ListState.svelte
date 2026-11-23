<script lang="ts" generics="T">
	import type { Snippet } from 'svelte';
	import Loading from '#lib/components/ui/feedback/Loading.svelte';
	import Message from '#lib/components/ui/feedback/Message.svelte';
	import Notice from '#lib/components/ui/feedback/Notice.svelte';

	/**
	 * Состояния экрана списка внутри `ScrollArea`: ошибка, первая загрузка (и повторы связи),
	 * полоска «Нет связи…» над прежним списком, пустой список — `empty`, иначе — `children`.
	 * Сообщения — `class="flex-none"`, сразу под шапкой (`components.md`, «Экран с прокруткой»).
	 */
	interface Props {
		/** Элементы; null — первая загрузка ещё не завершилась. */
		items: T[] | null;
		/** Текст ошибки загрузки или null. */
		error: string | null;
		/** Нет связи, идут повторы. */
		reconnecting: boolean;
		/** Список пуст. */
		empty: Snippet;
		/** Непустой список. */
		children: Snippet<[items: T[]]>;
	}

	let { items, error, reconnecting, empty, children }: Props = $props();
</script>

{#if error}
	<Message class="flex-none" title="Ошибка" text={error} tone="error" />
{:else if items === null}
	<Loading title={reconnecting ? 'Идёт попытка соединения…' : 'Загрузка…'} />
{:else}
	{#if reconnecting}
		<Notice pending>Нет связи. Пробуем снова…</Notice>
	{/if}
	{#if items.length === 0}
		{@render empty()}
	{:else}
		{@render children(items)}
	{/if}
{/if}
