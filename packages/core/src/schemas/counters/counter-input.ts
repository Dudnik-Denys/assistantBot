import { z } from 'zod';
import {
	COUNTER_DURATION_PART_MAX,
	COUNTER_DURATION_REQUIRED_MESSAGE,
	COUNTER_START_REQUIRED_MESSAGE,
	COUNTER_TIMER_MODE,
	COUNTER_TITLE_MAX,
	COUNTER_TITLE_REQUIRED_MESSAGE,
	COUNTER_TITLE_TOO_LONG_MESSAGE,
	LOCAL_DATE_TIME_MESSAGE,
} from '../../constants/counters.ts';

/** Локальные дата и время пользователя без пояса, с точностью до минуты: `2026-11-24T12:00`. */
const LocalDateTimeSchema = z.iso
	.datetime({ local: true, precision: -1, error: LOCAL_DATE_TIME_MESSAGE })
	// z.iso.datetime пропускает и `Z` на конце, а время здесь — только локальное.
	.regex(/T\d{2}:\d{2}$/, LOCAL_DATE_TIME_MESSAGE);

const DurationPartSchema = z.number().int().min(0).max(COUNTER_DURATION_PART_MAX).default(0);

/** Срок цикла: части складываются; хотя бы одна больше нуля. */
export const CounterDurationSchema = z
	.object({
		months: DurationPartSchema,
		weeks: DurationPartSchema,
		days: DurationPartSchema,
		hours: DurationPartSchema,
		minutes: DurationPartSchema,
	})
	.refine((duration) => Object.values(duration).some((part) => part > 0), {
		error: COUNTER_DURATION_REQUIRED_MESSAGE,
	});

export type CounterDuration = z.infer<typeof CounterDurationSchema>;

/**
 * Таймер: на срок (от старта) или до даты. Время — в часовом поясе пользователя. Старт цикла на
 * срок — свой (`customStart` и `startAt`) или момент сохранения (`customStart: false`, `startAt`
 * не нужен и не учитывается); у таймера до даты старт — всегда момент сохранения.
 */
export const CounterTimerInputSchema = z.discriminatedUnion('mode', [
	z
		.object({
			mode: z.literal(COUNTER_TIMER_MODE.Duration),
			customStart: z.boolean(),
			startAt: LocalDateTimeSchema.optional(),
			duration: CounterDurationSchema,
		})
		.refine((timer) => !timer.customStart || timer.startAt !== undefined, {
			error: COUNTER_START_REQUIRED_MESSAGE,
			path: ['startAt'],
		}),
	z.object({ mode: z.literal(COUNTER_TIMER_MODE.Date), targetAt: LocalDateTimeSchema }),
]);

export type CounterTimerInput = z.infer<typeof CounterTimerInputSchema>;

/**
 * Ввод счётчика (создание и изменение). Без таймера счётчик всегда ручной и не повторяется;
 * «те же параметры» и автоповтор — только у таймера на срок, автоповтор — вместе с ними. Прошедшую дату
 * проверяет сервис: для этого нужен часовой пояс пользователя.
 */
export const CounterInputSchema = z
	.object({
		title: z
			.string({ error: COUNTER_TITLE_REQUIRED_MESSAGE })
			.trim()
			.min(1, COUNTER_TITLE_REQUIRED_MESSAGE)
			.max(COUNTER_TITLE_MAX, COUNTER_TITLE_TOO_LONG_MESSAGE),
		manual: z.boolean(),
		showValue: z.boolean(),
		timer: CounterTimerInputSchema.nullable(),
		repeatSame: z.boolean(),
		autoRestart: z.boolean(),
		notify: z.boolean(),
		startStopHidden: z.boolean(),
	})
	.transform((input) => {
		const hasTimer = input.timer !== null;
		// До даты продолжения нет: следующий цикл вёл бы к дате, которую не выбирали, — новую
		// дату задают в настройках.
		const isDuration = input.timer?.mode === COUNTER_TIMER_MODE.Duration;
		const repeatSame = isDuration && input.repeatSame;
		return {
			...input,
			manual: !hasTimer || input.manual,
			repeatSame,
			autoRestart: repeatSame && input.autoRestart,
			notify: hasTimer && input.notify,
			startStopHidden: hasTimer && input.startStopHidden,
		};
	});

export type CounterInput = z.input<typeof CounterInputSchema>;
