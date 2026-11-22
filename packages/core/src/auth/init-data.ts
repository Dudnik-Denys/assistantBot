import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';

/**
 * Поле `user` из initData (https://core.telegram.org/bots/webapps#webappuser).
 * Берём только нужные поля; остальные (`is_premium`, `photo_url`…) отбрасываются.
 */
export const TelegramWebAppUserSchema = z.object({
	id: z.number().int().positive(),
	first_name: z.string().optional(),
	last_name: z.string().optional(),
	username: z.string().optional(),
	language_code: z.string().optional(),
});

export type TelegramWebAppUser = z.infer<typeof TelegramWebAppUserSchema>;

export interface ValidatedInitData {
	user: TelegramWebAppUser;
	authDate: Date;
}

export class InitDataError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'InitDataError';
	}
}

/**
 * Проверяет подпись initData Telegram Mini App.
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function validateInitData(
	initData: string,
	botToken: string,
	{ maxAgeSeconds = 24 * 60 * 60, now = new Date() } = {},
): ValidatedInitData {
	const params = new URLSearchParams(initData);
	const hash = params.get('hash');
	if (!hash) throw new InitDataError('В initData нет hash');
	params.delete('hash');

	const dataCheckString = [...params.entries()]
		.map(([k, v]) => `${k}=${v}`)
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
	const user = TelegramWebAppUserSchema.safeParse(parseJson(rawUser));
	if (!user.success) throw new InitDataError('Некорректный user в initData');

	return { user: user.data, authDate: new Date(authDateSec * 1000) };
}

/** JSON.parse без исключения: некорректный JSON → undefined (его отклонит схема). */
function parseJson(text: string): unknown {
	try {
		return JSON.parse(text);
	} catch {
		return undefined;
	}
}
