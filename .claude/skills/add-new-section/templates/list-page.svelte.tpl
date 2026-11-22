<script lang="ts">
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { api, type __Entity__Dto } from '#lib/api.ts';
	import __Entity__Card from '#lib/components/__entities__/__Entity__Card.svelte';
	import FloatingButton from '#lib/components/ui/buttons/FloatingButton.svelte';
	import Message from '#lib/components/ui/feedback/Message.svelte';
	import SearchBar from '#lib/components/ui/forms/SearchBar.svelte';
	import PageHeader from '#lib/components/ui/layout/PageHeader.svelte';
	import Screen from '#lib/components/ui/layout/Screen.svelte';
	import { DebouncedSearch } from '#lib/reactive/debounced-search.svelte.ts';

	const search = new DebouncedSearch<__Entity__Dto>((query, signal) =>
		api.__entities__.list(query, signal),
	);
</script>

<Screen>
	<PageHeader title="__Title__" onback={() => goto(resolve('/'))} backLabel="В меню">
		<SearchBar bind:value={search.query} label="Поиск: __Title__" />
	</PageHeader>

	{#if search.error}
		<Message title="Ошибка">{search.error}</Message>
	{:else if search.items === null}
		<Message title="Загрузка…" />
	{:else if search.items.length === 0}
		{#if search.hasQuery}
			<Message title="Ничего не найдено">Попробуйте другой запрос</Message>
		{:else}
			<Message title="Пока пусто">Нажмите «+», чтобы добавить __one__</Message>
		{/if}
	{:else}
		<ul class="flex flex-col gap-2 pb-20">
			{#each search.items as __entity__ (__entity__.id)}
				<li><__Entity__Card {__entity__} /></li>
			{/each}
		</ul>
	{/if}

	<FloatingButton href={resolve('/__entities__/new')} label="Добавить __one__">+</FloatingButton>
</Screen>
