import type { User } from '@tgab/db';
import { DEFAULT_TIMEZONE } from '#core/constants/users.ts';

/** Значения фейкового бота (`helpers/fake-bot.ts`): токен никуда не отправляется. */
export const FAKE_BOT_TOKEN = '123456:fake-token';
export const FAKE_BOT_ID = 123_456;
export const FAKE_BOT_USERNAME = 'tgab_test_bot';

/** Отправитель апдейтов по умолчанию. */
export const FAKE_USER_ID = 777_000;

/** Пользователь из allowlist, которого получают приватные роутеры (`withUser` в `helpers/fake-bot.ts`). */
export const FAKE_ALLOWED_USER: User = {
	id: '0198c2a4-0000-7000-8000-000000000001',
	telegramId: BigInt(FAKE_USER_ID),
	firstName: 'Тест',
	username: null,
	timezone: DEFAULT_TIMEZONE,
	isAdmin: false,
	createdAt: new Date('2026-01-01T00:00:00.000Z'),
	updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};
