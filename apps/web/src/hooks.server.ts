import { type Handle, sequence } from '@sveltejs/kit/hooks';
import { InitDataError, type TelegramIdentity, validateInitData } from '@tgab/core';
import { HttpStatus } from '#lib/constants/http-status.ts';
import { users } from '#lib/server/services.ts';
import { dev } from '$app/env';
import { BOT_TOKEN, DEV_TELEGRAM_ID } from '$app/env/private';

/**
 * Запрет индексации для всех ответов (страницы и API): приложение закрытое.
 * В отличие от robots.txt, заголовок не даёт поисковику показать адрес в выдаче,
 * даже если на него где-то есть ссылка.
 */
const noIndex: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);
	response.headers.set('X-Robots-Tag', 'noindex, nofollow');
	return response;
};

/**
 * API авторизуется по подписанным initData Mini App: заголовок `Authorization: tma <initData>`.
 * Незнакомые telegramId (не в allowlist) получают 403.
 */
const authorizeApi: Handle = async ({ event, resolve }) => {
	event.locals.user = null;
	if (!event.url.pathname.startsWith('/api/')) return resolve(event);

	const header = event.request.headers.get('authorization') ?? '';
	let identity: TelegramIdentity | null = null;

	if (header.startsWith('tma ')) {
		if (!BOT_TOKEN)
			return Response.json(
				{ error: 'BOT_TOKEN не настроен' },
				{ status: HttpStatus.InternalServerError },
			);
		try {
			const { user } = validateInitData(header.slice(4), BOT_TOKEN);
			identity = {
				telegramId: BigInt(user.id),
				firstName: user.first_name,
				username: user.username,
			};
		} catch (e) {
			if (e instanceof InitDataError)
				return Response.json({ error: e.message }, { status: HttpStatus.Unauthorized });
			throw e;
		}
	} else if (dev && DEV_TELEGRAM_ID) {
		identity = { telegramId: DEV_TELEGRAM_ID, firstName: 'Dev' };
	}

	if (!identity)
		return Response.json(
			{ error: 'Откройте приложение через Telegram' },
			{ status: HttpStatus.Unauthorized },
		);

	const user = await users.authenticate(identity);
	if (!user) {
		return Response.json(
			{ error: 'Доступ запрещён', telegramId: identity.telegramId.toString() },
			{ status: HttpStatus.Forbidden },
		);
	}
	event.locals.user = user;
	return resolve(event);
};

export const handle = sequence(noIndex, authorizeApi);
