import { describe, expect, test } from 'bun:test';
import {
	COUNTER_EMPTY_DURATION,
	COUNTER_TIMER_MODE,
	COUNTER_TIMER_STATUS,
	type CounterTimerStatus,
} from '#core/constants/counters.ts';
import type { CounterDto } from '#core/counters/types.ts';
import {
	filterCounters,
	isDue,
	isValueVisible,
	replaceCounters,
	timerMoment,
} from '#web/lib/counters.ts';

// Функции списка и экрана счётчика Mini App (`apps/web/src/lib/counters.ts`).

const CREATED_AT = '2026-01-15T10:00:00.000Z';
const TARGET_AT = '2026-01-15T11:00:00.000Z';
const PAUSED_AT = '2026-01-15T10:30:00.000Z';

function counter(id: string, status: CounterTimerStatus | null = null): CounterDto {
	return {
		id,
		title: `Счётчик ${id}`,
		value: 0,
		manual: false,
		showValue: false,
		timer: status
			? {
					mode: COUNTER_TIMER_MODE.Duration,
					duration: { ...COUNTER_EMPTY_DURATION, hours: 1 },
					startAt: CREATED_AT,
					targetAt: TARGET_AT,
					status,
					pausedAt: status === COUNTER_TIMER_STATUS.Paused ? PAUSED_AT : null,
					customStart: false,
				}
			: null,
		finishedAt: null,
		repeatSame: false,
		autoRestart: false,
		notify: false,
		startStopHidden: false,
		createdAt: CREATED_AT,
		updatedAt: CREATED_AT,
	};
}

const MANUAL = counter('manual');
const RUNNING = counter('running', COUNTER_TIMER_STATUS.Running);
const PAUSED = counter('paused', COUNTER_TIMER_STATUS.Paused);
const FINISHED = counter('finished', COUNTER_TIMER_STATUS.Finished);
const ALL = [MANUAL, RUNNING, PAUSED, FINISHED];

describe('isValueVisible', () => {
	test('Число видно при ручном управлении или включённом показе', () => {
		expect(isValueVisible(MANUAL)).toBe(false);
		expect(isValueVisible({ ...MANUAL, manual: true })).toBe(true);
		expect(isValueVisible({ ...MANUAL, showValue: true })).toBe(true);
	});
});

describe('isDue', () => {
	const target = Date.parse(TARGET_AT);

	test('Идущий таймер, время которого вышло', () => {
		expect(isDue(RUNNING, target)).toBe(true);
		expect(isDue(RUNNING, target - 1)).toBe(false);
	});

	test('Таймер на паузе, закончившийся и счётчик без таймера — не пора', () => {
		for (const item of [PAUSED, FINISHED, MANUAL]) expect(isDue(item, target + 1)).toBe(false);
	});
});

describe('filterCounters', () => {
	test('Счётчики каждой вкладки', () => {
		expect(filterCounters(ALL, 'all')).toEqual(ALL);
		expect(filterCounters(ALL, 'running')).toEqual([RUNNING]);
		expect(filterCounters(ALL, 'paused')).toEqual([PAUSED]);
		expect(filterCounters(ALL, 'finished')).toEqual([FINISHED]);
	});
});

describe('replaceCounters', () => {
	test('Замена по id с сохранением порядка, лишние не добавляются', () => {
		const updated = { ...PAUSED, value: 5 };
		expect(replaceCounters(ALL, [updated, counter('other')])).toEqual([
			MANUAL,
			RUNNING,
			updated,
			FINISHED,
		]);
	});
});

describe('timerMoment', () => {
	test('У паузы — момент её начала, иначе — текущий', () => {
		const now = Date.parse(TARGET_AT);
		expect(timerMoment(PAUSED, now)).toBe(Date.parse(PAUSED_AT));
		expect(timerMoment(RUNNING, now)).toBe(now);
	});
});
