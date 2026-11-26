import type { z } from 'zod';
import { INVALID_INPUT_MESSAGE } from '../constants/input.ts';
import { ValidationError } from '../errors.ts';

/**
 * Разбор ввода снаружи (`unknown`) схемой. Ошибка ввода — `ValidationError` с текстом первой
 * проблемы схемы: транспорт отвечает на неё 400. Ошибки, которые ввода не касаются (баг, сбой
 * БД), остаются своими — и становятся 500 с записью в лог, а не «некорректными данными».
 */
export function parseInput<S extends z.ZodType>(schema: S, input: unknown): z.output<S> {
	const result = schema.safeParse(input);
	if (!result.success) {
		throw new ValidationError(result.error.issues[0]?.message ?? INVALID_INPUT_MESSAGE);
	}
	return result.data;
}
