import type { User } from '@tgab/db';
import { ERROR_STATUSES } from '#lib/constants/error-statuses.server.ts';
import { HttpStatus } from '#lib/constants/http-status.ts';

/**
 * Ответ с заданным HTTP-кодом и текстом для пользователя; `errorResponse` превращает его в JSON.
 * `details` — дополнительные поля ответа (например, `telegramId` при 403).
 */
export class HttpStatusError extends Error {
	constructor(
		readonly status: number,
		message: string,
		readonly details: Record<string, unknown> = {},
	) {
		super(message);
	}
}

export function requireUser(locals: App.Locals): User {
	if (!locals.user) throw new HttpStatusError(HttpStatus.Unauthorized, 'Не авторизован');
	return locals.user;
}

/**
 * Единственное место, где ошибка становится HTTP-ответом `{ error, ...details }`:
 * свой `HttpStatusError` или ошибка из таблицы `ERROR_STATUSES`.
 * Неизвестную ошибку пробрасывает дальше — SvelteKit ответит 500 и запишет её в лог.
 */
export function errorResponse(e: unknown): Response {
	if (e instanceof HttpStatusError) return jsonError(e.status, e.message, e.details);
	for (const entry of ERROR_STATUSES) {
		if (e instanceof entry.type) return jsonError(entry.status, entry.message?.(e) ?? e.message);
	}
	throw e;
}

/** Обёртка эндпоинта: ошибки → `errorResponse`. */
export async function handleApi(fn: () => Promise<Response>): Promise<Response> {
	try {
		return await fn();
	} catch (e) {
		return errorResponse(e);
	}
}

export async function readJson(request: Request): Promise<unknown> {
	return request.json();
}

function jsonError(status: number, message: string, details: Record<string, unknown> = {}) {
	return Response.json({ ...details, error: message }, { status });
}
