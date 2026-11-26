<script lang="ts">
	/**
	 * Переключатель-флаг с подписью и пояснением, как в настройках iOS: нажимается только сам
	 * переключатель, а не вся строка — касание по тексту (например, чтобы закрыть клавиатуру
	 * под полем выше) флаг не меняет. Подпись и пояснение — его доступное имя и описание.
	 */
	interface Props {
		label: string;
		/** Пояснение под подписью. */
		description?: string;
		/**
		 * Состояние: `bind:checked` — или значение от родителя вместе с `onchange`, если показанное
		 * состояние вычисляется (флаг, который включён принудительно).
		 */
		checked: boolean;
		onchange?: (checked: boolean) => void;
		disabled?: boolean;
	}

	let { label, description, checked = $bindable(), onchange, disabled = false }: Props = $props();

	const id = $props.id();
</script>

<div class={['flex items-center gap-3', disabled && 'opacity-50']}>
	<span class="min-w-0 flex-1">
		<span id="{id}-label" class="block">{label}</span>
		{#if description}
			<span id="{id}-description" class="block text-xs text-tg-hint">{description}</span>
		{/if}
	</span>
	<label class="flex shrink-0">
		<input
			type="checkbox"
			role="switch"
			aria-labelledby="{id}-label"
			aria-describedby={description ? `${id}-description` : undefined}
			{checked}
			{disabled}
			onchange={(event) => {
				checked = event.currentTarget.checked;
				onchange?.(checked);
			}}
			class="peer sr-only"
		/>
		<!-- Нарисованный переключатель; состояние и фокус — от скрытого checkbox (peer). -->
		<span
			aria-hidden="true"
			class={[
				'relative h-7 w-12 shrink-0 rounded-full',
				'bg-tg-hint/30 peer-checked:bg-switch-on',
				'peer-focus-visible:ring-2 peer-focus-visible:ring-tg-button/40',
				'transition-colors motion-reduce:transition-none',
				// бегунок
				'after:absolute after:top-0.5 after:left-0.5 after:size-6 after:rounded-full',
				'after:bg-switch-knob after:shadow after:shadow-elevation',
				'after:transition-transform peer-checked:after:translate-x-5 motion-reduce:after:transition-none',
			]}
		></span>
	</label>
</div>
