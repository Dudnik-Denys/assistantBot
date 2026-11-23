import { parseEnv } from '@tgab/core/env';
import { EnvSchema } from '#worker/schemas/env.ts';

/** Переменные окружения воркера; при ошибке воркер не стартует и перечисляет все проблемы. */
export const env = parseEnv(
	EnvSchema,
	'Некорректные переменные окружения (см. README, «Переменные окружения»):',
);
