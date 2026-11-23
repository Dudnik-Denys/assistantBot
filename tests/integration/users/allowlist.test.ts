import { afterAll, beforeEach, describe, expect, test } from 'bun:test';
import { createUsersService } from '@tgab/core';
import type { User } from '@tgab/db';
import type { BotContext } from '#bot/context.ts';
import { createAllowlist } from '#bot/middlewares/allowlist.ts';
import { createTestUser } from '../../helpers/factories.ts';
import { TestDatabase } from '../../helpers/test-database.ts';

const STRANGER_TELEGRAM_ID = 222;

const testDatabase = TestDatabase.fromEnv();
const db = testDatabase.createClient();
const allowlist = createAllowlist(createUsersService(db));

beforeEach(() => testDatabase.reset(db));

afterAll(() => db.$disconnect());

interface FakeUpdate {
	from?: { id: number; is_bot: boolean; first_name: string };
	chatType?: 'private' | 'group';
}

/**
 * Апдейт в middleware без сети: контекст содержит только то, что читает allowlist (`from`, `chat`,
 * `reply`, `user`). Настоящий `Context` grammY отправил бы ответ в Telegram.
 */
async function runAllowlist({ from, chatType = 'private' }: FakeUpdate) {
	const replies: string[] = [];
	let passed = false;
	const fakeContext = {
		from,
		chat: { type: chatType },
		reply: async (text: string) => {
			replies.push(text);
		},
		user: undefined as User | undefined,
	};
	// Подделка контекста grammY: остальные его поля allowlist не использует.
	const ctx = fakeContext as unknown as BotContext;
	await allowlist(ctx, async () => {
		passed = true;
	});
	return { passed, replies, user: ctx.user };
}

function telegramUser(id: number | bigint) {
	return { id: Number(id), is_bot: false, first_name: 'Друг' };
}

describe('createAllowlist', () => {
	test('Пропуск пользователя из allowlist дальше с записью в ctx.user', async () => {
		const allowed = await createTestUser(db);
		const result = await runAllowlist({ from: telegramUser(allowed.telegramId) });
		expect(result.passed).toBe(true);
		expect(result.user?.id).toBe(allowed.id);
		expect(result.replies).toEqual([]);
	});

	test('Отказ незнакомому в личном чате с его Telegram ID в ответе', async () => {
		const result = await runAllowlist({ from: telegramUser(STRANGER_TELEGRAM_ID) });
		expect(result.passed).toBe(false);
		expect(result.user).toBeUndefined();
		expect(result.replies).toHaveLength(1);
		expect(result.replies[0]).toContain(String(STRANGER_TELEGRAM_ID));
	});

	test('Отказ незнакомому в группе без ответа', async () => {
		const result = await runAllowlist({
			from: telegramUser(STRANGER_TELEGRAM_ID),
			chatType: 'group',
		});
		expect(result.passed).toBe(false);
		expect(result.replies).toEqual([]);
	});

	test('Игнорирование апдейтов от ботов и без отправителя', async () => {
		const allowed = await createTestUser(db);
		const fromBot = await runAllowlist({
			from: { ...telegramUser(allowed.telegramId), is_bot: true },
		});
		const anonymous = await runAllowlist({});
		expect([fromBot.passed, anonymous.passed]).toEqual([false, false]);
		expect([...fromBot.replies, ...anonymous.replies]).toEqual([]);
	});
});
