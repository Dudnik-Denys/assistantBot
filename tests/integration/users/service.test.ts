import { afterAll, beforeEach, describe, expect, test } from 'bun:test';
import { createUsersService, NotFoundError } from '@tgab/core';
import { DEFAULT_TIMEZONE } from '#core/constants/users.ts';
import { TestDatabase } from '../../helpers/test-database.ts';

const ADMIN_TELEGRAM_ID = 111n;
const STRANGER_TELEGRAM_ID = 222n;

const testDatabase = TestDatabase.fromEnv();
const db = testDatabase.createClient();
const users = createUsersService(db, { adminTelegramId: ADMIN_TELEGRAM_ID });

beforeEach(() => testDatabase.reset(db));

afterAll(() => db.$disconnect());

describe('authenticate', () => {
	test('Тест возврата null для незнакомого пользователя без создания записи', async () => {
		expect(await users.authenticate({ telegramId: STRANGER_TELEGRAM_ID })).toBeNull();
		expect(await db.user.count()).toBe(0);
	});

	test('Тест создания админа при первом входе с часовым поясом по умолчанию', async () => {
		const admin = await users.authenticate({ telegramId: ADMIN_TELEGRAM_ID, firstName: 'Автор' });
		expect(admin).toMatchObject({ isAdmin: true, firstName: 'Автор', timezone: DEFAULT_TIMEZONE });
	});

	test('Тест обновления имени и username при их изменении', async () => {
		await users.allow(STRANGER_TELEGRAM_ID);
		const user = await users.authenticate({
			telegramId: STRANGER_TELEGRAM_ID,
			firstName: 'Новое',
			username: 'new_name',
		});
		expect(user).toMatchObject({ firstName: 'Новое', username: 'new_name' });
	});
});

describe('allow', () => {
	test('Тест добавления в allowlist обычным пользователем с часовым поясом по умолчанию', async () => {
		const user = await users.allow(STRANGER_TELEGRAM_ID);
		expect(user).toMatchObject({ isAdmin: false, timezone: DEFAULT_TIMEZONE });
	});

	test('Тест назначения существующего пользователя админом с флагом isAdmin', async () => {
		await users.allow(STRANGER_TELEGRAM_ID);
		expect((await users.allow(STRANGER_TELEGRAM_ID, { isAdmin: true })).isAdmin).toBe(true);
	});

	test('Тест сохранения прав админа при вызове без флага', async () => {
		await users.allow(STRANGER_TELEGRAM_ID, { isAdmin: true });
		expect((await users.allow(STRANGER_TELEGRAM_ID)).isAdmin).toBe(true);
	});
});

describe('getProfile', () => {
	test('Тест преобразования telegramId в строку без лишних полей', async () => {
		const user = await users.allow(STRANGER_TELEGRAM_ID);
		const dto = await users.getProfile(user.id);
		expect(dto.telegramId).toBe(STRANGER_TELEGRAM_ID.toString());
		expect(Object.keys(dto).sort()).toEqual([
			'firstName',
			'id',
			'isAdmin',
			'telegramId',
			'timezone',
		]);
	});

	test('Тест выброса NotFoundError для неизвестного пользователя', async () => {
		await expect(users.getProfile(crypto.randomUUID())).rejects.toThrow(NotFoundError);
	});
});
