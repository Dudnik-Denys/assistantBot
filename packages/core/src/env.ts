import { z } from 'zod';

/**
 * Схемы для строковых входных данных: переменные окружения и аргументы командной строки.
 * Файл зависит только от zod — его можно импортировать из `src/env.ts` SvelteKit и бота
 * через `@tgab/core/env`, не подтягивая сервисы и БД.
 */

/** telegramId из строки: только цифры, результат — bigint (как в БД). */
export const TelegramIdSchema = z
	.string()
	.regex(/^\d+$/, 'ожидается числовой telegramId')
	.transform(BigInt);

/** Необязательная переменная окружения: пустое значение (`NAME=` в .env) считается незаданным. */
export function optionalEnv<T extends z.ZodType<unknown, string>>(schema: T) {
	return z
		.string()
		.optional()
		.transform((value) => (value === '' ? undefined : value))
		.pipe(schema.optional());
}
