import { z } from 'zod';

/** Тип тестов — первый аргумент `run-tests.ts` и имя папки в `tests/`. */
export const TestTypeSchema = z.enum(['unit', 'integration']);

export type TestType = z.infer<typeof TestTypeSchema>;
