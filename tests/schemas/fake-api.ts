import { z } from 'zod';

/** Тело запроса к фейковому API в памяти (tests/unit/http/rest-resource.test.ts). */
export const FakeItemInputSchema = z.object({ title: z.string() });

export type FakeItemInput = z.infer<typeof FakeItemInputSchema>;

/** Запись фейкового API в ответе — схема, которой клиент проверяет ответы (unit/http). */
export const FakeItemDtoSchema = FakeItemInputSchema.extend({ id: z.string() });

export type FakeItemDto = z.infer<typeof FakeItemDtoSchema>;
