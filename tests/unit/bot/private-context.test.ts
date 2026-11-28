import { describe, expect, test } from 'bun:test';
import { Composer } from 'grammy';
import { type BotContext, hasUser, type PrivateContext } from '#bot/context.ts';
import { FAKE_ALLOWED_USER } from '../../constants/bot.ts';
import { createFakeBot, withUser } from '../../helpers/fake-bot.ts';

// Подключение приватных роутеров в `bot.ts`: `bot.filter(hasUser, router)`.

/** Приватный роутер, который запоминает id пользователя каждого апдейта, дошедшего до него. */
function recordingRouter(reached: string[]): Composer<PrivateContext> {
	const router = new Composer<PrivateContext>();
	router.use((ctx) => {
		reached.push(ctx.user.id);
	});
	return router;
}

describe('hasUser', () => {
	test('Тест отсечения апдейта без ctx.user до приватного роутера', async () => {
		const reached: string[] = [];
		const filtered = new Composer<BotContext>();
		filtered.filter(hasUser, recordingRouter(reached));
		await createFakeBot(filtered).send('/start');
		expect(reached).toEqual([]);
	});

	test('Тест пропуска апдейта с пользователем из allowlist', async () => {
		const reached: string[] = [];
		await createFakeBot(withUser(recordingRouter(reached))).send('/start');
		expect(reached).toEqual([FAKE_ALLOWED_USER.id]);
	});
});
