import type { z } from 'zod';
import { TMA_AUTH_SCHEME } from '#lib/constants/auth.ts';
import { HttpStatus } from '#lib/constants/http-status.ts';
import { ApiErrorBodySchema } from '#lib/schemas/api-error.ts';
import { webApp } from '#lib/telegram.ts';

/**
 * Ошибка ответа API: HTTP-статус, текст для пользователя
 * и тело ответа (например, telegramId при 403).
 */
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

/**
 * Ответил не наш API, а то, что стоит перед ним (туннель, прокси): тело не в формате
 * `{ error }`. Например, ngrok при выключенном туннеле отдаёт 404 — это «сервер недоступен»,
 * а не «не найдено», поэтому код такого ответа пользователю не показывается.
 */
export class ServerUnavailableError extends Error {
	constructor(readonly status: number) {
		super('Сервер не отвечает. Попробуйте чуть позже');
	}
}

/**
 * Наш API ответил, но тело не совпало со схемой ответа: обычно клиент устарел после обновления
 * сервера (новое поле, другой формат). Подробности — в `cause` и консоли.
 */
export class ResponseFormatError extends Error {
	constructor(
		readonly path: string,
		cause: z.ZodError,
	) {
		super('Приложение устарело. Закройте и откройте его снова', { cause });
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
 * сериализует тело в JSON, проверяет тело ответа схемой и превращает ошибки в `ApiError` (наш API
 * ответил ошибкой), `ResponseFormatError` (ответ не по схеме), `ServerUnavailableError` (ответил не
 * наш API: туннель, прокси) или `NetworkError` (ответа нет).
 */
export class HttpClient {
	constructor(private readonly baseUrl: string) {}

	/** Запрос с телом ответа: оно проверяется схемой `schema` (DTO из `@tgab/core/dto`). */
	request<S extends z.ZodType>(
		path: string,
		options: RequestOptions & { schema: S },
	): Promise<z.output<S>>;
	/** Запрос без тела ответа (`DELETE` → 204): тело, если есть, не читается. */
	request(path: string, options?: RequestOptions): Promise<void>;
	async request(
		path: string,
		options: RequestOptions & { schema?: z.ZodType } = {},
	): Promise<unknown> {
		const { method = 'GET', body, signal, fetchFn = fetch } = options;
		const headers = new Headers();
		const initData = webApp()?.initData;
		if (initData) headers.set('Authorization', `${TMA_AUTH_SCHEME} ${initData}`);
		if (body !== undefined) headers.set('Content-Type', 'application/json');

		let response: Response;
		try {
			response = await fetchFn(`${this.baseUrl}${path}`, {
				method,
				headers,
				signal,
				body: body === undefined ? undefined : JSON.stringify(body),
			});
		} catch (cause) {
			// Отмена через AbortController — не сбой сети, пробрасываем как есть.
			if (signal?.aborted) throw cause;
			throw new NetworkError(cause);
		}
		if (response.ok && (response.status === HttpStatus.NoContent || !options.schema)) return;
		// Не JSON (страница туннеля, прокси) — ответил не наш API, даже при коде 2xx.
		const data: unknown = await response.json().catch(() => undefined);
		if (data === undefined) throw new ServerUnavailableError(response.status);
		if (response.ok && options.schema) {
			const parsed = options.schema.safeParse(data);
			if (!parsed.success) throw new ResponseFormatError(path, parsed.error);
			return parsed.data;
		}
		const errorBody = ApiErrorBodySchema.safeParse(data);
		if (!errorBody.success) throw new ServerUnavailableError(response.status);
		throw new ApiError(response.status, errorBody.data.error, errorBody.data);
	}
}
