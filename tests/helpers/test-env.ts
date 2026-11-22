import { z } from 'zod';
import { type TestEnv, TestEnvSchema } from '../schemas/env.ts';

/** Переменные окружения тестов, проверенные схемой; при ошибке перечисляет все проблемы сразу. */
export const testEnv: TestEnv = parseTestEnv();

function parseTestEnv(): TestEnv {
	const result = TestEnvSchema.safeParse(process.env);
	if (!result.success) {
		throw new Error(
			`Некорректные переменные окружения тестов (см. README, «Переменные окружения»):\n${z.prettifyError(result.error)}`,
		);
	}
	return result.data;
}
