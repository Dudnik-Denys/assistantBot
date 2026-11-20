import { json } from '@sveltejs/kit';
import { ForbiddenError, NotFoundError } from '@tgab/core';
import type { User } from '@tgab/db';
import { z } from 'zod';

export class ApiError extends Error {
	constructor(
		readonly status: number,
		message: string
	) {
		super(message);
	}
}

export function requireUser(locals: App.Locals): User {
	if (!locals.user) throw new ApiError(401, 'Не авторизован');
	return locals.user;
}

/** Переводит доменные ошибки из packages/core в HTTP-ответы. */
export async function handleApi(fn: () => Promise<Response>): Promise<Response> {
	try {
		return await fn();
	} catch (e) {
		if (e instanceof ApiError) return json({ error: e.message }, { status: e.status });
		if (e instanceof NotFoundError) return json({ error: e.message }, { status: 404 });
		if (e instanceof ForbiddenError) return json({ error: e.message }, { status: 403 });
		if (e instanceof z.ZodError) {
			return json({ error: e.issues[0]?.message ?? 'Некорректные данные' }, { status: 400 });
		}
		if (e instanceof SyntaxError) return json({ error: 'Некорректный JSON' }, { status: 400 });
		throw e;
	}
}

export async function readJson(request: Request): Promise<unknown> {
	return request.json();
}
