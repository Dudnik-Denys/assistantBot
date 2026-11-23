<script lang="ts">
	/** Переключатель-флаг с подписью и пояснением, как в настройках iOS. */
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
</script>

<label class={['flex items-center gap-3', disabled && 'opacity-50']}>
	<span class="min-w-0 flex-1">
		<span class="block">{label}</span>
		{#if description}<span class="block text-xs text-tg-hint">{description}</span>{/if}
	</span>
	<input
		type="checkbox"
		role="switch"
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
			'transition-colors',
			// бегунок
			'after:absolute after:top-0.5 after:left-0.5 after:size-6 after:rounded-full',
			'after:bg-switch-knob after:shadow after:shadow-elevation',
			'after:transition-transform peer-checked:after:translate-x-5',
		]}
	></span>
</label>
