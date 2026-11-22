import { TMA_AUTH_SCHEME } from '#lib/constants/auth.ts';
import { HttpStatus } from '#lib/constants/http-status.ts';
import { webApp } from '#lib/telegram.ts';

/** Ошибка ответа API: HTTP-статус, текст для пользователя и тело ответа (например, telegramId при 403). */
export class ApiError extends Error {
	constructor(
		readonly status: number,
		message: string,
		readonly body: Record<string, unknown> = {},
	) {
		super(message);
	}
}

/** Сервер недоступен: нет интернета, сервер не отвечает (`fetch` не получил ответа). */
export class NetworkError extends Error {
	constructor(cause: unknown) {
		super('Нет связи с сервером. Проверьте интернет', { cause });
	}
}

/** Параметры одного запроса. */
export interface RequestOptions {
	method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
	/** Тело запроса; отправляется как JSON. */
	body?: unknown;
	/** Отмена запроса (AbortController). */
	signal?: AbortSignal;
	/** `fetch` из `load` (рекомендация SvelteKit); по умолчанию — глобальный. */
	fetchFn?: typeof fetch;
}

/**
 * Транспорт к API Mini App: подставляет `Authorization: tma <initData>`,
 * сериализует тело в JSON, разбирает ответ и превращает ошибки в `ApiError` (сервер ответил
 * ошибкой) или `NetworkError` (ответа нет).
 */
export class HttpClient {
	constructor(private readonly baseUrl: string) {}

	async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
		const { method = 'GET', body, signal, fetchFn = fetch } = options;
		const headers = new Headers();
		const initData = webApp()?.initData;
		if (initData) headers.set('Authorization', `${TMA_AUTH_SCHEME} ${initData}`);
		if (body !== undefined) headers.set('Content-Type', 'application/json');

		let res: Response;
		try {
			res = await fetchFn(`${this.baseUrl}${path}`, {
				method,
				headers,
				signal,
				body: body === undefined ? undefined : JSON.stringify(body),
			});
		} catch (e) {
			// Отмена через AbortController — не сбой сети, пробрасываем как есть.
			if (signal?.aborted) throw e;
			throw new NetworkError(e);
		}
		if (res.status === HttpStatus.NoContent) return undefined as T;
		const data = await res.json().catch(() => ({}));
		if (!res.ok) throw new ApiError(res.status, data.error ?? `Ошибка ${res.status}`, data);
		return data as T;
	}
}
