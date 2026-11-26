import { z } from 'zod';
import { IsoDateTimeSchema, RecordDtoSchema } from '../common/dto.ts';
import { IdSchema } from '../common/id.ts';

/** Уведомление об окончании цикла счётчика в ответе API: даты — ISO-строки. */
export const NotificationDtoSchema = RecordDtoSchema.extend({
	/** Число счётчика после этого цикла («Циклов пройдено»). */
	cycle: z.int(),
	/** Когда закончился цикл. */
	finishedAt: IsoDateTimeSchema,
	/** null — не прочитано. */
	readAt: IsoDateTimeSchema.nullable(),
	counter: z.object({
		id: IdSchema,
		title: z.string(),
		/** Цикл закончился и ждёт «Старт» (без автоповтора). */
		finished: z.boolean(),
		/** «Старт» сразу, с теми же параметрами; иначе — через настройки счётчика. */
		repeatSame: z.boolean(),
	}),
});

export type NotificationDto = z.infer<typeof NotificationDtoSchema>;
