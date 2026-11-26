import { z } from 'zod';
import { COUNTER_TIMER_MODE, COUNTER_TIMER_STATUS } from '../../constants/counters.ts';
import { IsoDateTimeSchema, RecordDtoSchema } from '../common/dto.ts';

const DurationPartDtoSchema = z.int().min(0);

/** Таймер счётчика в ответе API: даты — ISO-строки (UTC). */
const CounterTimerDtoSchema = z.object({
	mode: z.enum(COUNTER_TIMER_MODE),
	/** Срок цикла (у режима DATE — нули). */
	duration: z.object({
		months: DurationPartDtoSchema,
		weeks: DurationPartDtoSchema,
		days: DurationPartDtoSchema,
		hours: DurationPartDtoSchema,
		minutes: DurationPartDtoSchema,
	}),
	/** Начало и конец текущего цикла. */
	startAt: IsoDateTimeSchema,
	targetAt: IsoDateTimeSchema,
	/** RUNNING — цикл идёт, PAUSED — на паузе, FINISHED — закончился и ждёт «Старт». */
	status: z.enum(COUNTER_TIMER_STATUS),
	/** Когда поставлен на паузу (только у PAUSED): отсчёт на экране замирает на этом моменте. */
	pausedAt: IsoDateTimeSchema.nullable(),
	/** Старт цикла на срок задан вручную; false — старт в момент сохранения настроек. */
	customStart: z.boolean(),
});

/** Счётчик в ответе API: даты — ISO-строки. */
export const CounterDtoSchema = RecordDtoSchema.extend({
	title: z.string(),
	value: z.int(),
	/** Показывать кнопки − и + и «Сбросить». */
	manual: z.boolean(),
	/** Показывать число на экране счётчика (при `manual` число видно всегда). */
	showValue: z.boolean(),
	/** null — таймера нет (ручной счётчик). */
	timer: CounterTimerDtoSchema.nullable(),
	/** Когда закончился последний цикл; null — ещё ни разу. */
	finishedAt: IsoDateTimeSchema.nullable(),
	repeatSame: z.boolean(),
	autoRestart: z.boolean(),
	notify: z.boolean(),
	/** Скрыть кнопки «Старт» и «Стоп» (у таймера на паузе «Старт» видна всегда). */
	startStopHidden: z.boolean(),
	updatedAt: IsoDateTimeSchema,
});

export type CounterDto = z.infer<typeof CounterDtoSchema>;
