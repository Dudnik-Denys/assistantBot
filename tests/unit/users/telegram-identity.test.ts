import { describe, expect, test } from 'bun:test';
import { toTelegramIdentity } from '#core/users/service.ts';

const TEST_USER_ID = 42;

describe('toTelegramIdentity', () => {
	test('Перевод пользователя Telegram в TelegramIdentity с telegramId типа bigint', () => {
		expect(toTelegramIdentity({ id: TEST_USER_ID, first_name: 'Тест', username: 'test' })).toEqual({
			telegramId: BigInt(TEST_USER_ID),
			firstName: 'Тест',
			username: 'test',
		});
	});

	test('Сохранение undefined для отсутствующих необязательных полей', () => {
		expect(toTelegramIdentity({ id: TEST_USER_ID })).toEqual({
			telegramId: BigInt(TEST_USER_ID),
			firstName: undefined,
			username: undefined,
		});
	});

	test('Игнорирование лишних полей (как в ctx.from)', () => {
		const from = { id: TEST_USER_ID, first_name: 'Тест', is_bot: false, language_code: 'ru' };
		expect(Object.keys(toTelegramIdentity(from)).sort()).toEqual([
			'firstName',
			'telegramId',
			'username',
		]);
	});
});
