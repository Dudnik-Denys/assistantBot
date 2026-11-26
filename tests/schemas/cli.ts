import { z } from 'zod';

/** Тип тестов — первый аргумент `run-tests.ts` и имя папки в `tests/`. */
export const TestTypeSchema = z.enum(['unit', 'integration', 'e2e']);

export type TestType = z.infer<typeof TestTypeSchema>;
