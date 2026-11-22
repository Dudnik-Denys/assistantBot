import { createHmac, timingSafeEqual } from 'node:crypto';
import { INIT_DATA_MAX_AGE_SECONDS } from '../constants/auth.ts';
import { InitDataError } from '../errors.ts';
import { type TelegramUser, TelegramUserSchema } from '../schemas/users/telegram-user.ts';

export interface ValidatedInitData {
	user: TelegramUser;
	authDate: Date;
}

/**
 * Проверяет подпись initData Telegram Mini App.
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function validateInitData(
	initData: string,
	botToken: string,
	{ maxAgeSeconds = INIT_DATA_MAX_AGE_SECONDS, now = new Date() } = {},
): ValidatedInitData {
	const params = new URLSearchParams(initData);
	const hash = params.get('hash');
	if (!hash) throw new InitDataError('В initData нет hash');
	params.delete('hash');

	const dataCheckString = [...params.entries()]
		.map(([key, value]) => `${key}=${value}`)
		.sort()
		.join('\n');

	const secret = createHmac('sha256', 'WebAppData').update(botToken).digest();
	const expected = createHmac('sha256', secret).update(dataCheckString).digest();
	const actual = Buffer.from(hash, 'hex');
	if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
		throw new InitDataError('Неверная подпись initData');
	}

	const authDateSec = Number(params.get('auth_date'));
	if (!Number.isFinite(authDateSec) || authDateSec <= 0) {
		throw new InitDataError('Некорректный auth_date');
	}
	if (now.getTime() / 1000 - authDateSec > maxAgeSeconds) {
		throw new InitDataError('initData устарели');
	}

	const rawUser = params.get('user');
	if (!rawUser) throw new InitDataError('В initData нет user');
	const user = TelegramUserSchema.safeParse(parseJson(rawUser));
	if (!user.success) throw new InitDataError('Некорректный user в initData');

	return { user: user.data, authDate: new Date(authDateSec * 1000) };
}

/** Разбор JSON перед схемой: некорректный JSON → undefined (его отклонит схема). */
function parseJson(text: string): unknown {
	try {
		return JSON.parse(text);
	} catch {
		return undefined;
	}
}
