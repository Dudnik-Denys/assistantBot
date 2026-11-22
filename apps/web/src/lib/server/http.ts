import { ForbiddenError, NotFoundError } from '@tgab/core';
import type { User } from '@tgab/db';
import { z } from 'zod';
import { HttpStatus } from '#lib/constants/http-status.ts';

/** Ответ с заданным HTTP-кодом и текстом для пользователя; `handleApi` превращает его в JSON. */
export class HttpStatusError extends Error {
	constructor(
		readonly status: number,
		message: string,
	) {
		super(message);
	}
}

export function requireUser(locals: App.Locals): User {
	if (!locals.user) throw new HttpStatusError(HttpStatus.Unauthorized, 'Не авторизован');
	return locals.user;
}

/** Переводит доменные ошибки из packages/core в HTTP-ответы. */
export async function handleApi(fn: () => Promise<Response>): Promise<Response> {
	try {
		return await fn();
	} catch (e) {
		if (e instanceof HttpStatusError)
			return Response.json({ error: e.message }, { status: e.status });
		if (e instanceof NotFoundError)
			return Response.json({ error: e.message }, { status: HttpStatus.NotFound });
		if (e instanceof ForbiddenError)
			return Response.json({ error: e.message }, { status: HttpStatus.Forbidden });
		if (e instanceof z.ZodError) {
			return Response.json(
				{ error: e.issues[0]?.message ?? 'Некорректные данные' },
				{ status: HttpStatus.BadRequest },
			);
		}
		if (e instanceof SyntaxError)
			return Response.json({ error: 'Некорректный JSON' }, { status: HttpStatus.BadRequest });
		throw e;
	}
}

export async function readJson(request: Request): Promise<unknown> {
	return request.json();
}
