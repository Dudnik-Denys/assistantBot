import { describe, expect, test } from 'bun:test';
import { TelegramUserSchema } from '#core/schemas/users/telegram-user.ts';

const USER = { id: 123_456, first_name: 'Иван', username: 'ivan' };

describe('TelegramUserSchema', () => {
	test('Пользователь только с нужными полями, лишние отбрасываются', () => {
		expect(TelegramUserSchema.parse({ ...USER, is_premium: true, photo_url: 'x' })).toEqual(USER);
	});

	test('Достаточно одного id', () => {
		expect(TelegramUserSchema.parse({ id: USER.id })).toEqual({ id: USER.id });
	});

	test('Отклонение id не положительного целого числа', () => {
		for (const id of [0, -1, 1.5, '123', undefined]) {
			expect(TelegramUserSchema.safeParse({ ...USER, id }).success).toBe(false);
		}
	});

	test('Отклонение необязательных полей не того типа', () => {
		expect(TelegramUserSchema.safeParse({ ...USER, username: 42 }).success).toBe(false);
	});
});
