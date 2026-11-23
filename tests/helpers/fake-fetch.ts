/** Запрос, который получил подменный `fetch`. */
export interface FakeFetchCall {
	url: string;
	init: RequestInit;
}

/** Ответ на запрос: по адресу и параметрам — `Response` или ошибка (выброшенная — «нет связи»). */
export type FakeFetchHandler = (call: FakeFetchCall) => Response | Promise<Response>;

/**
 * Подменный `fetch` для unit-тестов кода Mini App: отвечает через `handler` и запоминает запросы
 * в `calls`. Передаётся как `fetchFn` в `HttpClient.request` или подменяет глобальный `fetch`
 * (`spyOn(globalThis, 'fetch').mockImplementation(fake.fetch)`).
 */
export function createFakeFetch(handler: FakeFetchHandler) {
	const calls: FakeFetchCall[] = [];
	const fakeFetch: typeof fetch = Object.assign(
		async (input: string | URL | Request, init: RequestInit = {}) => {
			const call = { url: String(input), init };
			calls.push(call);
			return handler(call);
		},
		{ preconnect: fetch.preconnect },
	);
	return { fetch: fakeFetch, calls };
}
