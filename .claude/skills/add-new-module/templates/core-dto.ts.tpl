import { z } from 'zod';
import { IsoDateTimeSchema, RecordDtoSchema } from '../common/dto.ts';

/**
 * __Title__ в ответе API: даты — ISO-строки, `bigint` — строки. Схема — и тип для сервера
 * (`to__Entity__Dto`), и проверка ответа на клиенте (`RestResource`).
 */
export const __Entity__DtoSchema = RecordDtoSchema.extend({
	title: z.string(),
	updatedAt: IsoDateTimeSchema,
});

export type __Entity__Dto = z.infer<typeof __Entity__DtoSchema>;
