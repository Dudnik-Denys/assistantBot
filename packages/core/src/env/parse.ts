import { z } from 'zod';

/**
 * Разбор переменных окружения схемой при старте приложения. При ошибке — исключение со всеми
 * проблемами сразу: приложение не запускается с неверным env. Схема и заголовок — свои у каждого
 * приложения (бот, тесты, позже воркер); общий здесь только порядок разбора и вид сообщения.
 *
 *   export const env = parseEnv(EnvSchema, 'Некорректные переменные окружения бота:');
 *
 * `title` — первая строка сообщения: чьи переменные и где они описаны. `source` — для тестов.
 */
export function parseEnv<T extends z.ZodType>(
	schema: T,
	title: string,
	source: unknown = process.env,
): z.output<T> {
	const result = schema.safeParse(source);
	if (!result.success) throw new Error(`${title}\n${z.prettifyError(result.error)}`);
	return result.data;
}
