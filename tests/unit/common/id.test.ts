import { describe, expect, test } from 'bun:test';
import { assertId } from '#core/common/id.ts';
import { NotFoundError } from '#core/errors.ts';
import { IdSchema } from '#core/schemas/common/id.ts';

const NOT_FOUND = 'Запись не найдена';

describe('IdSchema', () => {
	test('Тест принятия UUID седьмой версии (как у моделей Prisma)', () => {
		expect(IdSchema.safeParse(Bun.randomUUIDv7()).success).toBe(true);
	});

	test('Тест отклонения строки не в формате UUID', () => {
		expect(IdSchema.safeParse('abc').success).toBe(false);
		expect(IdSchema.safeParse('').success).toBe(false);
	});
});

describe('assertId', () => {
	test('Тест пропуска UUID без ошибки', () => {
		expect(() => assertId(Bun.randomUUIDv7(), NOT_FOUND)).not.toThrow();
	});

	test('Тест выброса NotFoundError с переданным текстом для строки не в формате UUID', () => {
		expect(() => assertId('abc', NOT_FOUND)).toThrow(NotFoundError);
		expect(() => assertId('abc', NOT_FOUND)).toThrow(NOT_FOUND);
	});
});
