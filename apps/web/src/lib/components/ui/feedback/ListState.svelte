<script lang="ts" generics="T">
	import type { Snippet } from 'svelte';
	import Loading from '#lib/components/ui/feedback/Loading.svelte';
	import Message from '#lib/components/ui/feedback/Message.svelte';
	import Notice from '#lib/components/ui/feedback/Notice.svelte';
	import { TestId } from '#lib/constants/test-ids.ts';
	import { UiText } from '#lib/constants/ui-texts.ts';

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
		/** Заголовок сообщения об ошибке загрузки. */
		errorTitle?: string;
		/** Заголовок первой загрузки и её повторов при обрыве связи. */
		loadingTitle?: string;
		reconnectingTitle?: string;
		/** Полоска над прежним списком, пока нет связи. */
		offlineText?: string;
	}

	let {
		items,
		error,
		reconnecting,
		empty,
		children,
		errorTitle = UiText.LoadingError,
		loadingTitle = UiText.Loading,
		reconnectingTitle = UiText.Reconnecting,
		offlineText = UiText.Offline,
	}: Props = $props();
</script>

{#if error}
	<Message
		class="flex-none"
		title={errorTitle}
		text={error}
		tone="error"
		data-testid={TestId.Common.ListError}
	/>
{:else if items === null}
	<Loading title={reconnecting ? reconnectingTitle : loadingTitle} />
{:else}
	{#if reconnecting}
		<Notice pending data-testid={TestId.Common.Offline}>{offlineText}</Notice>
	{/if}
	{#if items.length === 0}
		{@render empty()}
	{:else}
		{@render children(items)}
	{/if}
{/if}
