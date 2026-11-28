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

type RecordEvent = { locals: App.Locals; params: { id: string } };
type CollectionEvent = { locals: App.Locals; request: Request };

/**
 * Эндпоинты CRUD и действий (`api.md`, «Эндпоинты»): каждый берёт пользователя (и id из пути, и
 * тело запроса), вызывает метод сервиса и отвечает по REST-соглашению. Файл эндпоинта — строка на
 * метод: `export const GET: RequestHandler = recordAction((userId, id) => notes.get(userId, id));`
 */

/** `GET /<раздел>/[id]` и действие `POST /<раздел>/[id]/<действие>` — ответ DTO записи. */
export function recordAction(action: (userId: string, id: string) => Promise<unknown>) {
	return ({ locals, params }: RecordEvent) =>
		handleApi(async () => Response.json(await action(requireUser(locals).id, params.id)));
}

/** `PUT /<раздел>/[id]` — тело запроса в сервис, ответ — изменённый DTO. */
export function recordUpdate(
	update: (userId: string, id: string, input: unknown) => Promise<unknown>,
) {
	return ({ locals, params, request }: RecordEvent & { request: Request }) =>
		handleApi(async () => {
			const userId = requireUser(locals).id;
			return Response.json(await update(userId, params.id, await readJson(request)));
		});
}

/** `DELETE /<раздел>/[id]` — 204 без тела. */
export function recordDelete(remove: (userId: string, id: string) => Promise<void>) {
	return ({ locals, params }: RecordEvent) =>
		handleApi(async () => {
			await remove(requireUser(locals).id, params.id);
			return new Response(null, { status: HttpStatus.NoContent });
		});
}

/** `POST /<раздел>` — тело запроса в сервис, ответ — 201 и созданный DTO. */
export function collectionCreate(create: (userId: string, input: unknown) => Promise<unknown>) {
	return ({ locals, request }: CollectionEvent) =>
		handleApi(async () => {
			const userId = requireUser(locals).id;
			return Response.json(await create(userId, await readJson(request)), {
				status: HttpStatus.Created,
			});
		});
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
