<script lang="ts">
	/** Поле поиска со значком и кнопкой очистки. */
	interface Props {
		/** Текст поиска; связывается через `bind:value`. */
		value?: string;
		/** Подпись для экранного диктора. */
		label?: string;
		/** Видимая подсказка в пустом поле. */
		placeholder?: string;
	}

	let { value = $bindable(''), label = 'Поиск', placeholder = 'Поиск' }: Props = $props();
</script>

<label class="relative block">
	<span class="sr-only">{label}</span>
	<svg
		class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-tg-hint"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2.2"
		stroke-linecap="round"
		aria-hidden="true"
	>
		<circle cx="11" cy="11" r="7" />
		<path d="m20 20-3.5-3.5" />
	</svg>
	<input
		type="search"
		bind:value
		{placeholder}
		autocomplete="off"
		enterkeyhint="search"
		class={[
			'h-10 w-full rounded-xl pr-3 pl-9 text-base',
			'bg-surface text-tg-text outline-none placeholder:text-tg-hint',
			'focus:ring-2 focus:ring-tg-button/40',
			// своя кнопка очистки ниже вместо системного крестика
			'[&::-webkit-search-cancel-button]:hidden',
		]}
	/>
	{#if value}
		<button
			type="button"
			class={[
				'absolute top-1/2 right-2 flex -translate-y-1/2 items-center justify-center',
				'size-6 rounded-full text-xs',
				'bg-tg-hint/30 text-tg-bg',
			]}
			aria-label="Очистить"
			onclick={() => (value = '')}
		>
			✕
		</button>
	{/if}
</label>
