import { z } from 'zod';

/** Окружение-образец для проверки `parseEnv` (tests/unit/env/parse.test.ts). */
export const SampleEnvSchema = z.object({
	TOKEN: z.string().min(1),
	PORT: z.coerce.number().int(),
});

/** Переменная, которая есть в любом окружении процесса, — проверка чтения `process.env`. */
export const ProcessPathEnvSchema = z.object({ PATH: z.string() });
