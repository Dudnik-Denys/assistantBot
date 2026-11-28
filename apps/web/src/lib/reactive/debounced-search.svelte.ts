import { SEARCH_DELAY_MS } from '#lib/constants/delays.ts';
import { ListLoader } from '#lib/reactive/list-loader.svelte.ts';

/** Загрузка списка по запросу; signal нужен, чтобы отменить устаревший запрос. */
export type SearchLoader<T> = (query: string, signal: AbortSignal) => Promise<T[]>;

export interface DebouncedSearchOptions<T> {
	/** Пауза перед поиском по непустому запросу. */
	delayMs?: number;
	/** Уже известный список (кеш): показывается сразу, пока идёт загрузка. */
	initialItems?: T[] | null;
}

/**
 * Список с поиском: `ListLoader`, параметр которого — текст поиска. Непустой запрос ждёт паузу
 * после ввода (debounce), пустой (первое открытие) загружается сразу; отмена устаревших запросов
 * и повторы при обрыве связи — от `ListLoader`. Список без поиска — сразу `ListLoader`.
 *
 * Создавать при инициализации компонента (в <script>): эффект живёт, пока жив компонент.
 *
 *   const search = new DebouncedSearch((query, signal) => api.notes.list(query, signal));
 *   <SearchBar bind:value={search.query} />
 *   {#each search.items ?? [] as item}…
 */
export class DebouncedSearch<T extends { id: string }> {
	/** Текст поиска; связывается с полем ввода через bind:value. */
	query = $state('');
	/** Есть ли непустой запрос — чтобы отличать «ничего не найдено» от «список пуст». */
	hasQuery = $derived(this.query.trim() !== '');
	readonly #loader: ListLoader<T, string>;

	constructor(
		load: SearchLoader<T>,
		{ delayMs = SEARCH_DELAY_MS, initialItems = null }: DebouncedSearchOptions<T> = {},
	) {
		this.#loader = new ListLoader((signal, query) => load(query, signal), {
			params: () => this.query.trim(),
			delayMs: (query) => (query ? delayMs : 0),
			initialItems,
		});
	}

	/** Найденные элементы; null — первая загрузка ещё не завершилась. */
	get items(): T[] | null {
		return this.#loader.items;
	}

	set items(items: T[] | null) {
		this.#loader.items = items;
	}

	/** Текст ошибки последней загрузки или null. */
	get error(): string | null {
		return this.#loader.error;
	}

	/** Нет связи, идут повторные попытки. */
	get reconnecting(): boolean {
		return this.#loader.reconnecting;
	}

	/** Убрать элемент из списка (после удаления на сервере), не загружая список заново. */
	removeItem(id: string): void {
		this.#loader.removeItem(id);
	}
}
