<script lang="ts">
	import { resolve } from '$app/paths';
	import { api, type CounterDto } from '#lib/api.ts';
	import CounterCard from '#lib/components/counters/CounterCard.svelte';
	import FloatingButton from '#lib/components/ui/buttons/FloatingButton.svelte';
	import ListState from '#lib/components/ui/feedback/ListState.svelte';
	import Message from '#lib/components/ui/feedback/Message.svelte';
	import SegmentedControl from '#lib/components/ui/forms/SegmentedControl.svelte';
	import PageHeader from '#lib/components/ui/layout/PageHeader.svelte';
	import Screen from '#lib/components/ui/layout/Screen.svelte';
	import ScrollArea from '#lib/components/ui/layout/ScrollArea.svelte';
	import {
		COUNTER_EMPTY_TAB_MESSAGES,
		COUNTER_REFRESH_DELAY_MS,
		COUNTER_TAB_ALL,
		COUNTER_TABS,
		type CounterTab,
	} from '#lib/constants/counters.ts';
	import { filterCounters, isDue, removeCounter, replaceCounters } from '#lib/counters.ts';
	import { holdKeyboard } from '#lib/keyboard.ts';
	import { Clock } from '#lib/reactive/clock.svelte.ts';
	import { ListLoader } from '#lib/reactive/list-loader.svelte.ts';
	import { RepeatWhile } from '#lib/reactive/repeat-while.svelte.ts';

	// Без поиска: загрузка с повторами при обрыве связи и показ последнего списка из кеша.
	const loader = new ListLoader((signal) => api.counters.list('', signal), {
		initialItems: api.counters.cachedList,
	});
	const clock = new Clock();

	let tab = $state<CounterTab>(COUNTER_TAB_ALL);

	const visible = $derived(filterCounters(loader.items ?? [], tab));

	/** Есть счётчики, время цикла которых вышло, а сервер ещё отдаёт их идущими. */
	const hasDue = $derived(loader.items?.some((counter) => isDue(counter, clock.now)) ?? false);

	// Как на экране счётчика: завершить наступившие циклы сразу, не дожидаясь воркера.
	new RepeatWhile(
		() => hasDue,
		async () => {
			const updated = await api.counters.finishDue();
			if (loader.items) loader.items = replaceCounters(loader.items, updated);
		},
		COUNTER_REFRESH_DELAY_MS,
	);

	async function remove(counter: CounterDto) {
		if (!(await removeCounter(counter))) return;
		loader.removeItem(counter.id);
	}
</script>

<Screen fit>
	<PageHeader title="Счётчики" backToMenu>
		<SegmentedControl options={COUNTER_TABS} bind:value={tab} label="Какие счётчики показать" />
	</PageHeader>

	<ScrollArea>
		<ListState items={loader.items} error={loader.error} reconnecting={loader.reconnecting}>
			{#snippet empty()}
				<Message
					class="flex-none"
					title="У вас пока нет ни одного счётчика"
					text="Нажмите «+», чтобы создать первый"
				/>
			{/snippet}
			{#snippet children()}
				{#if visible.length === 0 && tab !== COUNTER_TAB_ALL}
					<Message class="flex-none" title={COUNTER_EMPTY_TAB_MESSAGES[tab]} />
				{:else}
					<ul class="flex flex-col gap-2 pb-floating-clearance">
						{#each visible as counter (counter.id)}
							<li><CounterCard {counter} now={clock.now} onremove={() => remove(counter)} /></li>
						{/each}
					</ul>
				{/if}
			{/snippet}
		</ListState>
	</ScrollArea>

	<!-- клавиатура открывается сразу по касанию: на iOS иначе фокус в название не встанет -->
	<FloatingButton href={resolve('/counters/new')} label="Новый счётчик" onopen={holdKeyboard}>
		+
	</FloatingButton>
</Screen>
