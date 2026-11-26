import { describe, expect, test } from 'bun:test';
import {
	COUNTER_DURATION_PART_MAX,
	COUNTER_DURATION_REQUIRED_MESSAGE,
	COUNTER_START_REQUIRED_MESSAGE,
	COUNTER_TIMER_MODE,
	COUNTER_TITLE_MAX,
	COUNTER_TITLE_REQUIRED_MESSAGE,
	COUNTER_TITLE_TOO_LONG_MESSAGE,
	LOCAL_DATE_TIME_MESSAGE,
} from '#core/constants/counters.ts';
import { CounterInputSchema } from '#core/schemas/counters/counter-input.ts';

const BASE_INPUT = {
	title: 'Счётчик',
	manual: false,
	showValue: true,
	timer: null,
	repeatSame: true,
	autoRestart: true,
	notify: true,
	startStopHidden: true,
};

const HOUR_TIMER = {
	mode: COUNTER_TIMER_MODE.Duration,
	customStart: false,
	duration: { hours: 1 },
};
const DATE_TIMER = { mode: COUNTER_TIMER_MODE.Date, targetAt: '2026-12-31T12:00' };

function firstMessage(input: unknown): string | undefined {
	return CounterInputSchema.safeParse(input).error?.issues[0]?.message;
}

describe('CounterInputSchema', () => {
	test('Обрезка пробелов в названии', () => {
		expect(CounterInputSchema.parse({ ...BASE_INPUT, title: '  Вода  ' }).title).toBe('Вода');
	});

	test('Отклонение счётчика без названия, в том числе из одних пробелов', () => {
		for (const title of [undefined, '', '   ']) {
			expect(firstMessage({ ...BASE_INPUT, title })).toBe(COUNTER_TITLE_REQUIRED_MESSAGE);
		}
	});

	test(`Ограничение названия ${COUNTER_TITLE_MAX} символами включительно`, () => {
		expect(
			CounterInputSchema.safeParse({ ...BASE_INPUT, title: 'а'.repeat(COUNTER_TITLE_MAX) }).success,
		).toBe(true);
		expect(firstMessage({ ...BASE_INPUT, title: 'а'.repeat(COUNTER_TITLE_MAX + 1) })).toBe(
			COUNTER_TITLE_TOO_LONG_MESSAGE,
		);
	});

	test('Счётчик без таймера — всегда ручной, без повтора, уведомлений и скрытых кнопок', () => {
		expect(CounterInputSchema.parse(BASE_INPUT)).toMatchObject({
			manual: true,
			repeatSame: false,
			autoRestart: false,
			notify: false,
			startStopHidden: false,
		});
	});

	test('Таймер на срок сохраняет повтор, автоповтор и уведомления', () => {
		expect(CounterInputSchema.parse({ ...BASE_INPUT, timer: HOUR_TIMER })).toMatchObject({
			manual: false,
			repeatSame: true,
			autoRestart: true,
			notify: true,
			startStopHidden: true,
		});
	});

	test('Таймер до даты сбрасывает повтор и автоповтор', () => {
		expect(CounterInputSchema.parse({ ...BASE_INPUT, timer: DATE_TIMER })).toMatchObject({
			repeatSame: false,
			autoRestart: false,
			notify: true,
		});
	});

	test('Автоповтор только вместе с повтором тех же параметров', () => {
		const input = { ...BASE_INPUT, timer: HOUR_TIMER, repeatSame: false };
		expect(CounterInputSchema.parse(input).autoRestart).toBe(false);
	});

	test('Подстановка нулей в незаполненные части срока', () => {
		const parsed = CounterInputSchema.parse({ ...BASE_INPUT, timer: HOUR_TIMER });
		expect(parsed.timer).toEqual({
			...HOUR_TIMER,
			duration: { months: 0, weeks: 0, days: 0, hours: 1, minutes: 0 },
		});
	});

	test('Отклонение нулевого срока', () => {
		const timer = { ...HOUR_TIMER, duration: { hours: 0 } };
		expect(firstMessage({ ...BASE_INPUT, timer })).toBe(COUNTER_DURATION_REQUIRED_MESSAGE);
	});

	test(`Ограничение части срока ${COUNTER_DURATION_PART_MAX} включительно, без дробей и минусов`, () => {
		const withDays = (days: number) => ({
			...BASE_INPUT,
			timer: { ...HOUR_TIMER, duration: { days } },
		});
		expect(CounterInputSchema.safeParse(withDays(COUNTER_DURATION_PART_MAX)).success).toBe(true);
		for (const days of [COUNTER_DURATION_PART_MAX + 1, 1.5, -1]) {
			expect(CounterInputSchema.safeParse(withDays(days)).success).toBe(false);
		}
	});

	test('Отклонение своего старта без даты и времени', () => {
		const timer = { ...HOUR_TIMER, customStart: true };
		expect(firstMessage({ ...BASE_INPUT, timer })).toBe(COUNTER_START_REQUIRED_MESSAGE);
	});

	test('Свой старт с датой и временем', () => {
		const timer = { ...HOUR_TIMER, customStart: true, startAt: '2026-12-01T09:30' };
		expect(CounterInputSchema.safeParse({ ...BASE_INPUT, timer }).success).toBe(true);
	});

	test('Отклонение даты не в формате локального времени до минуты', () => {
		for (const targetAt of [
			'2026-12-31',
			'2026-12-31T12:00:30',
			'2026-12-31T12:00Z',
			'2026-12-31T12:00+02:00',
			'31.12.2026 12:00',
		]) {
			const timer = { ...DATE_TIMER, targetAt };
			expect(firstMessage({ ...BASE_INPUT, timer })).toBe(LOCAL_DATE_TIME_MESSAGE);
		}
	});
});
