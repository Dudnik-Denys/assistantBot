import { z } from 'zod';
import { IsoDateTimeSchema, RecordDtoSchema } from '../common/dto.ts';

/** Заметка в ответе API: даты — ISO-строки. */
export const NoteDtoSchema = RecordDtoSchema.extend({
	title: z.string(),
	content: z.string(),
	updatedAt: IsoDateTimeSchema,
});

export type NoteDto = z.infer<typeof NoteDtoSchema>;
