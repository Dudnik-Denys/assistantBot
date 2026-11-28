import { describe, expect, test } from 'bun:test';
import { TelegramUserSchema } from '#core/schemas/users/telegram-user.ts';

const USER = { id: 123_456, first_name: 'Иван', username: 'ivan' };

describe('TelegramUserSchema', () => {
	test('Тест разбора пользователя только с нужными полями без лишних', () => {
		expect(TelegramUserSchema.parse({ ...USER, is_premium: true, photo_url: 'x' })).toEqual(USER);
	});

	test('Тест разбора пользователя с одним id', () => {
		expect(TelegramUserSchema.parse({ id: USER.id })).toEqual({ id: USER.id });
	});

	test('Тест отклонения id не положительного целого числа', () => {
		for (const id of [0, -1, 1.5, '123', undefined]) {
			expect(TelegramUserSchema.safeParse({ ...USER, id }).success).toBe(false);
		}
	});

	test('Тест отклонения необязательных полей не того типа', () => {
		expect(TelegramUserSchema.safeParse({ ...USER, username: 42 }).success).toBe(false);
	});
});
