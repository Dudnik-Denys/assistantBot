import { optionalEnv } from '@tgab/core/env';
import { z } from 'zod';
import { PORT_MAX } from '../constants/env.ts';

const PortSchema = z
	.string()
	.regex(/^\d+$/, 'ожидается номер порта')
	.transform(Number)
	.pipe(z.number().int().min(1).max(PORT_MAX));

/** Переменные окружения тестов. Все необязательные: без них тесты идут на контейнер по умолчанию. */
export const TestEnvSchema = z.object({
	/** Задаёт CI (GitHub Actions — `CI=true`): тестовую БД даёт CI, контейнер не поднимается. */
	CI: optionalEnv(z.string()).transform((value) => value !== undefined && value !== 'false'),
	/** Своя тестовая БД вместо контейнера; имя базы обязано кончаться на `_test`. */
	TEST_DATABASE_URL: optionalEnv(z.url()),
	/** Порт контейнера `postgres-test` на хосте. */
	POSTGRES_TEST_PORT: optionalEnv(PortSchema),
});

export type TestEnv = z.infer<typeof TestEnvSchema>;
