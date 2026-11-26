import type { User } from '@tgab/db';
import { ERROR_STATUSES } from '#lib/constants/error-statuses.server.ts';
import { INVALID_JSON_MESSAGE } from '#lib/constants/errors.ts';
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
export function errorResponse(error: unknown): Response {
	if (error instanceof HttpStatusError)
		return jsonError(error.status, error.message, error.details);
	for (const entry of ERROR_STATUSES) {
		if (error instanceof entry.type)
			return jsonError(entry.status, entry.message?.(error) ?? error.message);
	}
	throw error;
}

/** Обёртка эндпоинта: ошибки → `errorResponse`. */
export async function handleApi(handler: () => Promise<Response>): Promise<Response> {
	try {
		return await handler();
	} catch (error) {
		return errorResponse(error);
	}
}

/**
 * Эндпоинт действия над записью (`POST /<раздел>/[id]/<действие>`, `api.md`): берёт пользователя
 * и id из пути, вызывает метод сервиса и отвечает изменённым DTO. Файл действия — одна строка:
 * `export const POST: RequestHandler = recordAction((userId, id) => counters.pause(userId, id));`
 */
export function recordAction(action: (userId: string, id: string) => Promise<unknown>) {
	return ({ locals, params }: { locals: App.Locals; params: { id: string } }) =>
		handleApi(async () => Response.json(await action(requireUser(locals).id, params.id)));
}

/** Тело запроса как JSON; не JSON — 400 «Некорректный JSON» (ошибка ввода, а не сервера). */
export async function readJson(request: Request): Promise<unknown> {
	try {
		return await request.json();
	} catch {
		throw new HttpStatusError(HttpStatus.BadRequest, INVALID_JSON_MESSAGE);
	}
}

function jsonError(status: number, message: string, details: Record<string, unknown> = {}) {
	return Response.json({ ...details, error: message }, { status });
}
