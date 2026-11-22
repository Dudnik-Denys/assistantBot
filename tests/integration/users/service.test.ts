import { afterAll, beforeEach, describe, expect, test } from 'bun:test';
import { createUsersService, toUserDto } from '@tgab/core';
import { DEFAULT_TIMEZONE } from '#core/users/schema.ts';
import { createTestDb, resetDb } from '../../helpers/test-database.ts';

const ADMIN_TELEGRAM_ID = 111n;
const STRANGER_TELEGRAM_ID = 222n;

const db = createTestDb();
const users = createUsersService(db, { adminTelegramId: ADMIN_TELEGRAM_ID });

beforeEach(() => resetDb(db));

afterAll(() => db.$disconnect());

describe('authenticate', () => {
	test('незнакомому пользователю — null, запись не создаётся', async () => {
		expect(await users.authenticate({ telegramId: STRANGER_TELEGRAM_ID })).toBeNull();
		expect(await db.user.count()).toBe(0);
	});

	test('админ создаётся при первом входе с часовым поясом по умолчанию', async () => {
		const admin = await users.authenticate({ telegramId: ADMIN_TELEGRAM_ID, firstName: 'Автор' });
		expect(admin).toMatchObject({ isAdmin: true, firstName: 'Автор', timezone: DEFAULT_TIMEZONE });
	});

	test('обновляет имя и username, если они изменились', async () => {
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
	test('добавляет в allowlist обычным пользователем с часовым поясом по умолчанию', async () => {
		const user = await users.allow(STRANGER_TELEGRAM_ID);
		expect(user).toMatchObject({ isAdmin: false, timezone: DEFAULT_TIMEZONE });
	});

	test('с isAdmin делает существующего админом', async () => {
		await users.allow(STRANGER_TELEGRAM_ID);
		expect((await users.allow(STRANGER_TELEGRAM_ID, { isAdmin: true })).isAdmin).toBe(true);
	});

	test('без флага не отнимает права админа', async () => {
		await users.allow(STRANGER_TELEGRAM_ID, { isAdmin: true });
		expect((await users.allow(STRANGER_TELEGRAM_ID)).isAdmin).toBe(true);
	});
});

describe('toUserDto', () => {
	test('telegramId — строка, лишних полей нет', async () => {
		const dto = toUserDto(await users.allow(STRANGER_TELEGRAM_ID));
		expect(dto.telegramId).toBe(STRANGER_TELEGRAM_ID.toString());
		expect(Object.keys(dto).sort()).toEqual([
			'firstName',
			'id',
			'isAdmin',
			'telegramId',
			'timezone',
		]);
	});
});
