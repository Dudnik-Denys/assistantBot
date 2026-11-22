import { describe, expect, test } from 'bun:test';
import { DatabaseUrlSchema, optionalEnv, TelegramIdSchema } from '#core/schemas/env/variables.ts';

/** Больше Number.MAX_SAFE_INTEGER: через number значение исказилось бы. */
const LARGE_TELEGRAM_ID = '9007199254740993';

describe('TelegramIdSchema', () => {
	test('Превращение строки из цифр в bigint', () => {
		expect(TelegramIdSchema.parse('123456')).toBe(123456n);
	});

	test('Сохранение точности большого id', () => {
		expect(TelegramIdSchema.parse(LARGE_TELEGRAM_ID)).toBe(BigInt(LARGE_TELEGRAM_ID));
	});

	test('Отклонение всего, кроме цифр', () => {
		for (const value of ['', '12a', '-5', ' 12', '1.5']) {
			expect(TelegramIdSchema.safeParse(value).success).toBe(false);
		}
	});
});

describe('optionalEnv', () => {
	const OptionalTelegramIdSchema = optionalEnv(TelegramIdSchema);

	test('Возврат undefined для незаданной переменной', () => {
		expect(OptionalTelegramIdSchema.parse(undefined)).toBeUndefined();
	});

	test('Возврат undefined для пустого значения (NAME= в .env)', () => {
		expect(OptionalTelegramIdSchema.parse('')).toBeUndefined();
	});

	test('Проверка заданного значения вложенной схемой', () => {
		expect(OptionalTelegramIdSchema.parse('42')).toBe(42n);
		expect(OptionalTelegramIdSchema.safeParse('не число').success).toBe(false);
	});
});

describe('DatabaseUrlSchema', () => {
	test('Принятие строки подключения', () => {
		const url = 'postgresql://user:pass@localhost:5432/db';
		expect(DatabaseUrlSchema.parse(url)).toBe(url);
	});

	test('Понятный текст ошибки для пустой строки', () => {
		expect(DatabaseUrlSchema.safeParse('').error?.issues[0]?.message).toBe('DATABASE_URL не задан');
	});

	test('Отклонение незаданного значения', () => {
		expect(DatabaseUrlSchema.safeParse(undefined).success).toBe(false);
	});
});
