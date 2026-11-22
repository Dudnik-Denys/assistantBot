import { z } from 'zod';
import { type Env, EnvSchema } from '#bot/schemas/env.ts';

/** Переменные окружения бота; при ошибке бот не стартует и перечисляет все проблемы сразу. */
export const env = parseEnv();

function parseEnv(): Env {
	const result = EnvSchema.safeParse(process.env);
	if (!result.success) {
		throw new Error(
			`Некорректные переменные окружения (см. README, «Переменные окружения»):\n${z.prettifyError(result.error)}`,
		);
	}
	return result.data;
}
