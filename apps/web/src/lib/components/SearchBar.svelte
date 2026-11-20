<script lang="ts">
	let { value = $bindable('') }: { value?: string } = $props();
</script>

<label class="relative block">
	<span class="sr-only">Поиск по заметкам</span>
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
		placeholder="Поиск"
		autocomplete="off"
		enterkeyhint="search"
		class="h-10 w-full rounded-xl bg-tg-secondary-bg pr-3 pl-9 text-base text-tg-text outline-none placeholder:text-tg-hint focus:ring-2 focus:ring-tg-button/40 [&::-webkit-search-cancel-button]:hidden"
	/>
	{#if value}
		<button
			type="button"
			class="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full bg-tg-hint/30 text-xs text-tg-bg"
			aria-label="Очистить"
			onclick={() => (value = '')}>✕</button
		>
	{/if}
</label>
