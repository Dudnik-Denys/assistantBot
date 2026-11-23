import { RECONNECT_DELAYS_MS, SEARCH_DELAY_MS } from '#lib/constants/delays.ts';
import { errorMessage, isConnectionError } from '#lib/errors.ts';

/** Загрузка списка по запросу; signal нужен, чтобы отменить устаревший запрос. */
export type SearchLoader<T> = (query: string, signal: AbortSignal) => Promise<T[]>;

export interface DebouncedSearchOptions<T> {
	/** Пауза перед поиском по непустому запросу. */
	delayMs?: number;
	/** Уже известный список (кеш): показывается сразу, пока идёт загрузка. */
	initialItems?: T[] | null;
}

/**
 * Список с поиском: загружает элементы по запросу с паузой после ввода (debounce)
 * и отменяет устаревшие запросы, чтобы медленный ответ на «кот» не перезаписал ответ на «котлеты».
 * При ошибке связи повторяет запрос (`reconnecting`), а не сразу показывает ошибку.
 *
 * Создавать при инициализации компонента (в <script>): эффект живёт, пока жив компонент.
 *
 *   const search = new DebouncedSearch((query, signal) => api.notes.list(query, signal));
 *   <SearchBar bind:value={search.query} />
 *   {#each search.items ?? [] as item}…
 */
export class DebouncedSearch<T> {
	/** Текст поиска; связывается с полем ввода через bind:value. */
	query = $state('');
	/** Найденные элементы; null — первая загрузка ещё не завершилась. */
	items = $state<T[] | null>(null);
	/** Текст ошибки последней загрузки или null. */
	error = $state<string | null>(null);
	/** Нет связи, идут повторные попытки; `items` при этом — прежние (например, из кеша). */
	reconnecting = $state(false);
	/** Есть ли непустой запрос — чтобы отличать «ничего не найдено» от «список пуст». */
	hasQuery = $derived(this.query.trim() !== '');

	constructor(
		load: SearchLoader<T>,
		{ delayMs = SEARCH_DELAY_MS, initialItems = null }: DebouncedSearchOptions<T> = {},
	) {
		this.items = initialItems;
		$effect(() => {
			const query = this.query.trim();
			const controller = new AbortController();
			let timer: ReturnType<typeof setTimeout> | undefined;
			let failedAttempts = 0;
			let retryScheduled = false;

			const run = () => {
				retryScheduled = false;
				load(query, controller.signal)
					.then((items) => {
						if (controller.signal.aborted) return;
						this.items = items;
						this.error = null;
						this.reconnecting = false;
					})
					.catch((error: unknown) => {
						if (controller.signal.aborted) return;
						const retryDelay = RECONNECT_DELAYS_MS[failedAttempts];
						if (isConnectionError(error) && retryDelay !== undefined) {
							failedAttempts++;
							this.error = null; // ошибка прошлого запроса не перекрывает «пробуем снова»
							this.reconnecting = true;
							retryScheduled = true;
							timer = setTimeout(run, retryDelay);
							return;
						}
						this.reconnecting = false;
						this.error = errorMessage(error);
					});
			};

			const retryNow = () => {
				if (!retryScheduled) return;
				clearTimeout(timer);
				run();
			};

			// Пустой запрос (первое открытие) — сразу, непустой — после паузы в наборе.
			timer = setTimeout(run, query ? delayMs : 0);
			window.addEventListener('online', retryNow);
			return () => {
				clearTimeout(timer);
				controller.abort();
				window.removeEventListener('online', retryNow);
			};
		});
	}
}
