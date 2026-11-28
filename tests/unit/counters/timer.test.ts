import { describe, expect, test } from 'bun:test';
import {
	COUNTER_CATCH_UP_MAX,
	COUNTER_EMPTY_DURATION,
	COUNTER_TIMER_MODE,
	COUNTER_TIMER_STATUS,
} from '#core/constants/counters.ts';
import { MS_PER_DAY, MS_PER_HOUR } from '#core/constants/time.ts';
import { DEFAULT_TIMEZONE } from '#core/constants/users.ts';
import { addDuration, finishCycle, localToUtc, nextCycle } from '#core/counters/timer.ts';

// Киев: UTC+2 зимой, UTC+3 летом; в 2026 году летнее время — с 29 марта, зимнее — с 25 октября.
const TIME_ZONE = DEFAULT_TIMEZONE;
const HOUR = { ...COUNTER_EMPTY_DURATION, hours: 1 };
const DAY = { ...COUNTER_EMPTY_DURATION, days: 1 };
const MONTH = { ...COUNTER_EMPTY_DURATION, months: 1 };
const INITIAL_VALUE = 5;

function local(value: string): Date {
	return localToUtc(value, TIME_ZONE);
}

describe('localToUtc', () => {
	test('Тест перевода зимнего времени в UTC со смещением +2', () => {
		expect(local('2026-01-15T12:00').toISOString()).toBe('2026-01-15T10:00:00.000Z');
	});

	test('Тест перевода летнего времени в UTC со смещением +3', () => {
		expect(local('2026-07-15T12:00').toISOString()).toBe('2026-07-15T09:00:00.000Z');
	});
});

describe('addDuration', () => {
	test('Тест дня через переход на летнее время: те же часы на циферблате (23 часа)', () => {
		const end = addDuration(local('2026-03-28T12:00'), DAY, TIME_ZONE);
		expect(end).toEqual(local('2026-03-29T12:00'));
		expect(end.getTime() - local('2026-03-28T12:00').getTime()).toBe(23 * MS_PER_HOUR);
	});

	test('Тест дня через переход на зимнее время: те же часы на циферблате (25 часов)', () => {
		const end = addDuration(local('2026-10-24T12:00'), DAY, TIME_ZONE);
		expect(end.getTime() - local('2026-10-24T12:00').getTime()).toBe(25 * MS_PER_HOUR);
	});

	test('Тест суток в часах через переход на летнее время: ровно 24 часа', () => {
		const start = local('2026-03-28T12:00');
		const end = addDuration(start, { ...COUNTER_EMPTY_DURATION, hours: 24 }, TIME_ZONE);
		expect(end.getTime() - start.getTime()).toBe(MS_PER_DAY);
	});

	test('Тест месяца от 31 января: последний день февраля', () => {
		expect(addDuration(local('2026-01-31T12:00'), MONTH, TIME_ZONE)).toEqual(
			local('2026-02-28T12:00'),
		);
	});

	test('Тест месяца от 31 января високосного года: 29 февраля', () => {
		expect(addDuration(local('2028-01-31T12:00'), MONTH, TIME_ZONE)).toEqual(
			local('2028-02-29T12:00'),
		);
	});

	test('Тест года от 29 февраля: 28 февраля следующего года', () => {
		const year = { ...COUNTER_EMPTY_DURATION, months: 12 };
		expect(addDuration(local('2028-02-29T12:00'), year, TIME_ZONE)).toEqual(
			local('2029-02-28T12:00'),
		);
	});

	test('Тест сложения всех частей срока', () => {
		const duration = { months: 1, weeks: 1, days: 1, hours: 1, minutes: 1 };
		expect(addDuration(local('2026-01-01T12:00'), duration, TIME_ZONE)).toEqual(
			local('2026-02-09T13:01'),
		);
	});
});

describe('nextCycle', () => {
	test('Тест таймера на срок: тот же срок от нового старта', () => {
		const source = {
			timerMode: COUNTER_TIMER_MODE.Duration,
			startAt: local('2026-01-01T12:00'),
			targetAt: local('2026-01-31T12:00'),
			duration: MONTH,
		};
		const from = local('2026-01-31T12:00');
		expect(nextCycle(source, from, TIME_ZONE)).toEqual({
			startAt: from,
			targetAt: local('2026-02-28T12:00'),
		});
	});

	test('Тест таймера до даты: та же длина, что у прошлого цикла', () => {
		const source = {
			timerMode: COUNTER_TIMER_MODE.Date,
			startAt: local('2026-01-01T12:00'),
			targetAt: local('2026-01-03T12:00'),
			duration: COUNTER_EMPTY_DURATION,
		};
		const from = local('2026-01-10T15:00');
		expect(nextCycle(source, from, TIME_ZONE)).toEqual({
			startAt: from,
			targetAt: new Date(from.getTime() + 2 * MS_PER_DAY),
		});
	});
});

describe('finishCycle', () => {
	const hourCycle = {
		timerMode: COUNTER_TIMER_MODE.Duration,
		startAt: local('2026-01-01T11:00'),
		targetAt: local('2026-01-01T12:00'),
		duration: HOUR,
		value: INITIAL_VALUE,
	};

	test('Тест окончания без автоповтора: +1 и статус FINISHED с тем же циклом', () => {
		const now = local('2026-01-01T15:00');
		expect(finishCycle({ ...hourCycle, autoRestart: false }, now, TIME_ZONE)).toEqual({
			value: INITIAL_VALUE + 1,
			startAt: hourCycle.startAt,
			targetAt: hourCycle.targetAt,
			status: COUNTER_TIMER_STATUS.Finished,
			finishedAt: hourCycle.targetAt,
		});
	});

	test('Тест автоповтора в момент окончания: +1 и новый цикл от конца прошлого', () => {
		const result = finishCycle({ ...hourCycle, autoRestart: true }, hourCycle.targetAt, TIME_ZONE);
		expect(result).toEqual({
			value: INITIAL_VALUE + 1,
			startAt: hourCycle.targetAt,
			targetAt: local('2026-01-01T13:00'),
			status: COUNTER_TIMER_STATUS.Running,
			finishedAt: hourCycle.targetAt,
		});
	});

	test('Тест досчёта пропущенных циклов постоянной длины делением', () => {
		const now = local('2026-01-01T14:30');
		const result = finishCycle({ ...hourCycle, autoRestart: true }, now, TIME_ZONE);
		// Закончились циклы в 12:00, 13:00 и 14:00; идёт цикл 14:00–15:00.
		expect(result).toEqual({
			value: INITIAL_VALUE + 3,
			startAt: local('2026-01-01T14:00'),
			targetAt: local('2026-01-01T15:00'),
			status: COUNTER_TIMER_STATUS.Running,
			finishedAt: local('2026-01-01T14:00'),
		});
	});

	test('Тест досчёта пропущенных циклов до даты делением по длине прошлого цикла', () => {
		const dateCycle = {
			timerMode: COUNTER_TIMER_MODE.Date,
			startAt: local('2026-01-01T12:00'),
			targetAt: local('2026-01-02T12:00'),
			duration: COUNTER_EMPTY_DURATION,
			value: INITIAL_VALUE,
			autoRestart: true,
		};
		const result = finishCycle(dateCycle, local('2026-01-04T13:00'), TIME_ZONE);
		expect(result.value).toBe(INITIAL_VALUE + 3);
		expect(result.targetAt).toEqual(local('2026-01-05T12:00'));
	});

	test('Тест досчёта календарных циклов перебором через переход на летнее время', () => {
		const dayCycle = {
			timerMode: COUNTER_TIMER_MODE.Duration,
			startAt: local('2026-03-27T12:00'),
			targetAt: local('2026-03-28T12:00'),
			duration: DAY,
			value: INITIAL_VALUE,
			autoRestart: true,
		};
		const result = finishCycle(dayCycle, local('2026-03-30T12:30'), TIME_ZONE);
		// Закончились циклы 28, 29 и 30 марта — каждый в 12:00 по Киеву, хотя 29-го сутки короче.
		expect(result).toEqual({
			value: INITIAL_VALUE + 3,
			startAt: local('2026-03-30T12:00'),
			targetAt: local('2026-03-31T12:00'),
			status: COUNTER_TIMER_STATUS.Running,
			finishedAt: local('2026-03-30T12:00'),
		});
	});

	test(`Тест ограничения ${COUNTER_CATCH_UP_MAX} календарными циклами за раз`, () => {
		const dayCycle = {
			timerMode: COUNTER_TIMER_MODE.Duration,
			startAt: local('2020-01-01T12:00'),
			targetAt: local('2020-01-02T12:00'),
			duration: DAY,
			value: INITIAL_VALUE,
			autoRestart: true,
		};
		const now = local('2026-01-01T12:30');
		const result = finishCycle(dayCycle, now, TIME_ZONE);
		expect(result.value).toBe(INITIAL_VALUE + COUNTER_CATCH_UP_MAX);
		// Остальные пропущенные циклы — в следующий проход: окончание текущего уже наступило.
		expect(result.targetAt <= now).toBe(true);
	});
});
