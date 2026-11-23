import { parseEnv } from '@tgab/core/env';
import { EnvSchema } from '#bot/schemas/env.ts';

/** Переменные окружения бота; при ошибке бот не стартует и перечисляет все проблемы сразу. */
export const env = parseEnv(
	EnvSchema,
	'Некорректные переменные окружения (см. README, «Переменные окружения»):',
);
