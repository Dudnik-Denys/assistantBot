import { parseEnv } from '@tgab/core/env';
import { type TestEnv, TestEnvSchema } from '../schemas/env.ts';

/** Переменные окружения тестов, проверенные схемой; при ошибке перечисляет все проблемы сразу. */
export const testEnv: TestEnv = parseEnv(
	TestEnvSchema,
	'Некорректные переменные окружения тестов (см. README, «Переменные окружения»):',
);
