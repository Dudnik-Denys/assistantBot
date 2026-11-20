import { json } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit/hooks';
import { InitDataError, validateInitData, type TelegramIdentity } from '@tgab/core';
import { dev } from '$app/env';
import { BOT_TOKEN, DEV_TELEGRAM_ID } from '$app/env/private';
import { users } from '#lib/server/services.ts';

/**
 * API авторизуется по подписанным initData Mini App: заголовок `Authorization: tma <initData>`.
 * Незнакомые telegramId (не в allowlist) получают 403.
 */
export const handle: Handle = async ({ event, resolve }) => {
	event.locals.user = null;
	if (!event.url.pathname.startsWith('/api/')) return resolve(event);

	const header = event.request.headers.get('authorization') ?? '';
	let identity: TelegramIdentity | null = null;

	if (header.startsWith('tma ')) {
		if (!BOT_TOKEN) return json({ error: 'BOT_TOKEN не настроен' }, { status: 500 });
		try {
			const { user } = validateInitData(header.slice(4), BOT_TOKEN);
			identity = {
				telegramId: BigInt(user.id),
				firstName: user.first_name,
				username: user.username
			};
		} catch (e) {
			if (e instanceof InitDataError) return json({ error: e.message }, { status: 401 });
			throw e;
		}
	} else if (dev && DEV_TELEGRAM_ID) {
		identity = { telegramId: DEV_TELEGRAM_ID, firstName: 'Dev' };
	}

	if (!identity) return json({ error: 'Откройте приложение через Telegram' }, { status: 401 });

	const user = await users.authenticate(identity);
	if (!user) {
		return json(
			{ error: 'Доступ запрещён', telegramId: identity.telegramId.toString() },
			{ status: 403 }
		);
	}
	event.locals.user = user;
	return resolve(event);
};
