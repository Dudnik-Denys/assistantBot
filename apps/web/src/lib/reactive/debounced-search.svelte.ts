import { errorMessage, isConnectionError } from '#lib/errors.ts';

/** Загрузка списка по запросу; signal нужен, чтобы отменить устаревший запрос. */
export type SearchLoader<T> = (query: string, signal: AbortSignal) => Promise<T[]>;

/**
 * Паузы между повторами при ошибке связи: всего 30 секунд попыток, потом — ошибка.
 * Появление сети (событие `online`) запускает повтор сразу, не дожидаясь паузы.
 */
const RECONNECT_DELAYS_MS = [2_000, 4_000, 8_000, 16_000];

/**
 * Список с поиском: загружает элементы по запросу с паузой после ввода (debounce)
 * и отменяет устаревшие запросы, чтобы медленный ответ на «кот» не перезаписал ответ на «котлеты».
 * При ошибке связи повторяет запрос (`reconnecting`), а не сразу показывает ошибку.
 *
 * Создавать при инициализации компонента (в <script>): эффект живёт, пока жив компонент.
 *
 *   const search = new DebouncedSearch((q, signal) => api.notes.list(q, signal));
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

	/** `initialItems` — уже известный список (кеш): показывается сразу, пока идёт загрузка. */
	constructor(
		load: SearchLoader<T>,
		{ delayMs = 250, initialItems = null }: { delayMs?: number; initialItems?: T[] | null } = {},
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
					.catch((e: unknown) => {
						if (controller.signal.aborted) return;
						const retryDelay = RECONNECT_DELAYS_MS[failedAttempts];
						if (isConnectionError(e) && retryDelay !== undefined) {
							failedAttempts++;
							this.error = null; // ошибка прошлого запроса не перекрывает «пробуем снова»
							this.reconnecting = true;
							retryScheduled = true;
							timer = setTimeout(run, retryDelay);
							return;
						}
						this.reconnecting = false;
						this.error = errorMessage(e);
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
