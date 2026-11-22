import { errorMessage } from '#lib/errors.ts';

/** Загрузка списка по запросу; signal нужен, чтобы отменить устаревший запрос. */
export type SearchLoader<T> = (query: string, signal: AbortSignal) => Promise<T[]>;

/**
 * Список с поиском: загружает элементы по запросу с паузой после ввода (debounce)
 * и отменяет устаревшие запросы, чтобы медленный ответ на «кот» не перезаписал ответ на «котлеты».
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
	/** Есть ли непустой запрос — чтобы отличать «ничего не найдено» от «список пуст». */
	hasQuery = $derived(this.query.trim() !== '');

	constructor(load: SearchLoader<T>, { delayMs = 250 }: { delayMs?: number } = {}) {
		$effect(() => {
			const query = this.query.trim();
			const controller = new AbortController();
			// Пустой запрос (первое открытие) — сразу, непустой — после паузы в наборе.
			const timer = setTimeout(
				() => {
					load(query, controller.signal)
						.then((items) => {
							this.items = items;
							this.error = null;
						})
						.catch((e: unknown) => {
							if (controller.signal.aborted) return;
							this.error = errorMessage(e);
						});
				},
				query ? delayMs : 0,
			);
			return () => {
				clearTimeout(timer);
				controller.abort();
			};
		});
	}
}
