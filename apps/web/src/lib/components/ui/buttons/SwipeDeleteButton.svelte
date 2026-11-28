<script lang="ts">
	import { TestId } from '#lib/constants/test-ids.ts';
	import { UiText } from '#lib/constants/ui-texts.ts';

	/**
	 * Кнопка «Удалить» в действиях `SwipeActions`: выполняет `onremove`
	 * (подтверждение и запрос) и закрывает строку, когда он завершится.
	 */
	interface Props {
		/** Спросить подтверждение и удалить. */
		onremove: () => Promise<void>;
		/** `close` из snippet `actions` у `SwipeActions`. */
		close: () => void;
		label?: string;
	}

	let { onremove, close, label = UiText.Remove }: Props = $props();
</script>

<button
	type="button"
	class="w-24 bg-tg-destructive font-semibold text-on-destructive"
	data-testid={TestId.Common.SwipeDelete}
	onclick={async () => {
		await onremove();
		close();
	}}
>
	{label}
</button>
