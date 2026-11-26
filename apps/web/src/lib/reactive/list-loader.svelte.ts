import { RECONNECT_DELAYS_MS } from '#lib/constants/delays.ts';
import { errorMessage, isConnectionError } from '#lib/errors.ts';

export interface ListLoaderOptions<T, P> {
	/**
	 * Параметры загрузки (например, текст поиска): функция читает реактивное состояние, и при его
	 * изменении список загружается заново, а устаревший запрос отменяется.
	 */
	params?: () => P;
	/** Пауза перед загрузкой с этими параметрами (поиск ждёт конца набора); по умолчанию — 0. */
	delayMs?: (params: P) => number;
	/** Уже известный список (кеш): показывается сразу, пока идёт загрузка. */
	initialItems?: T[] | null;
}

/**
 * Загрузка списка с экрана: сразу при открытии и заново при смене параметров; устаревший запрос
 * отменяется (медленный ответ на «кот» не перезапишет ответ на «котлеты»). При ошибке связи —
 * повторы с паузами (`reconnecting`) и сразу, когда сеть вернулась (`online`), а не ошибка.
 *
 * Создавать при инициализации компонента (в <script>): эффект живёт, пока жив компонент.
 *
 *   const loader = new ListLoader((signal) => api.counters.list('', signal), {
 *   	initialItems: api.counters.cachedList,
 *   });
 *   <ListState items={loader.items} error={loader.error} reconnecting={loader.reconnecting}>
 *
 * Список с полем поиска — `DebouncedSearch` (поверх этого класса).
 */
export class ListLoader<T, P = undefined> {
	/** Загруженные элементы; null — первая загрузка ещё не завершилась. */
	items = $state<T[] | null>(null);
	/** Текст ошибки последней загрузки или null. */
	error = $state<string | null>(null);
	/** Нет связи, идут повторные попытки; `items` при этом — прежние (например, из кеша). */
	reconnecting = $state(false);

	constructor(
		load: (signal: AbortSignal, params: P) => Promise<T[]>,
		{ params, delayMs = () => 0, initialItems = null }: ListLoaderOptions<T, P> = {},
	) {
		this.items = initialItems;
		$effect(() => {
			// Без `params` загрузка одна, параметр — `undefined` (тип P по умолчанию).
			const current = (params ? params() : undefined) as P;
			const controller = new AbortController();
			let timer: ReturnType<typeof setTimeout> | undefined;
			let failedAttempts = 0;
			let retryScheduled = false;

			const run = () => {
				retryScheduled = false;
				load(controller.signal, current)
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

			timer = setTimeout(run, delayMs(current));
			window.addEventListener('online', retryNow);
			return () => {
				clearTimeout(timer);
				controller.abort();
				window.removeEventListener('online', retryNow);
			};
		});
	}
}
