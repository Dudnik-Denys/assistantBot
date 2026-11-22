import { type TelegramIdentity, toTelegramIdentity, validateInitData } from '@tgab/core';
import type { User } from '@tgab/db';
import { TMA_AUTH_SCHEME } from '#lib/constants/auth.ts';
import { HttpStatus } from '#lib/constants/http-status.ts';
import { HttpStatusError } from '#lib/server/http.ts';
import { users } from '#lib/server/services.ts';
import { dev } from '$app/env';
import { BOT_TOKEN, DEV_TELEGRAM_ID } from '$app/env/private';

/**
 * Пользователь, от имени которого пришёл запрос к API.
 * Ошибки — `HttpStatusError` (401 — не представился, 403 — нет в allowlist, с `telegramId`)
 * и `InitDataError` (401 — подпись не прошла); ответ из них делает `errorResponse`.
 */
export async function authenticateRequest(request: Request): Promise<User> {
	const identity = identify(request);
	if (!identity) {
		throw new HttpStatusError(HttpStatus.Unauthorized, 'Откройте приложение через Telegram');
	}
	const user = await users.authenticate(identity);
	if (!user) {
		throw new HttpStatusError(HttpStatus.Forbidden, 'Доступ запрещён', {
			telegramId: identity.telegramId.toString(),
		});
	}
	return user;
}

/** Кто делает запрос: по подписанным initData или, только в `vite dev`, — `DEV_TELEGRAM_ID`. */
function identify(request: Request): TelegramIdentity | null {
	const initData = readInitData(request);
	if (initData !== null) {
		if (!BOT_TOKEN) {
			throw new HttpStatusError(HttpStatus.InternalServerError, 'BOT_TOKEN не настроен');
		}
		return toTelegramIdentity(validateInitData(initData, BOT_TOKEN).user);
	}
	if (dev && DEV_TELEGRAM_ID) return { telegramId: DEV_TELEGRAM_ID, firstName: 'Dev' };
	return null;
}

/** initData из заголовка `Authorization: tma <initData>`; null — заголовка такого вида нет. */
function readInitData(request: Request): string | null {
	const prefix = `${TMA_AUTH_SCHEME} `;
	const header = request.headers.get('authorization') ?? '';
	return header.startsWith(prefix) ? header.slice(prefix.length) : null;
}
