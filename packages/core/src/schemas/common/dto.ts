import { z } from 'zod';
import { IdSchema } from './id.ts';

/** Дата и время в ответе API: ISO-строка UTC (`toISOString()`). */
export const IsoDateTimeSchema = z.iso.datetime();

/** Общие поля записи в ответе API. */
export const RecordDtoSchema = z.object({
	id: IdSchema,
	createdAt: IsoDateTimeSchema,
});
