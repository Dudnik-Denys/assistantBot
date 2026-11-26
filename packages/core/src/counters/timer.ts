import { TZDate } from '@date-fns/tz';
import { add } from 'date-fns';
import {
	COUNTER_CATCH_UP_MAX,
	COUNTER_TIMER_MODE,
	COUNTER_TIMER_STATUS,
	type CounterTimerMode,
	type CounterTimerStatus,
} from '../constants/counters.ts';
import { MS_PER_SECOND, SECONDS_PER_HOUR, SECONDS_PER_MINUTE } from '../constants/time.ts';
import type { CounterDuration } from '../schemas/counters/counter-input.ts';

/**
 * Время таймера счётчика. Всё хранится в UTC, а сроки складываются в часовом поясе
 * пользователя: «1 месяц» — календарный месяц, «1 день» через переход на летнее время — те же
 * часы на циферблате, а не ровно 24 часа.
 */

/** Локальные дата и время (`2026-11-24T12:00`, уже проверены схемой) в поясе → момент в UTC. */
export function localToUtc(local: string, timeZone: string): Date {
	const [date = '', time = ''] = local.split('T');
	const [year = 0, month = 1, day = 1] = date.split('-').map(Number);
	const [hours = 0, minutes = 0] = time.split(':').map(Number);
	return new Date(new TZDate(year, month - 1, day, hours, minutes, timeZone).getTime());
}

/** Конец цикла: `start` + срок, сложенный в часовом поясе пользователя. */
export function addDuration(start: Date, duration: CounterDuration, timeZone: string): Date {
	return new Date(add(new TZDate(start, timeZone), duration).getTime());
}

/** Параметры, по которым строится следующий цикл. */
export interface CycleSource {
	timerMode: CounterTimerMode;
	startAt: Date;
	targetAt: Date;
	duration: CounterDuration;
}

/**
 * Следующий цикл «с теми же параметрами», начиная с `from`: на срок — тот же срок,
 * до даты — та же длина, что у прошлого цикла (от запуска до даты).
 */
export function nextCycle(
	source: CycleSource,
	from: Date,
	timeZone: string,
): { startAt: Date; targetAt: Date } {
	if (source.timerMode === COUNTER_TIMER_MODE.Duration) {
		return { startAt: from, targetAt: addDuration(from, source.duration, timeZone) };
	}
	const length = source.targetAt.getTime() - source.startAt.getTime();
	return { startAt: from, targetAt: new Date(from.getTime() + length) };
}

/**
 * Длина цикла в мс, если она постоянна: таймер «до даты» и срок из одних часов и минут.
 * null — срок календарный (месяцы, недели, дни): его длина зависит от месяца и перехода
 * на летнее время.
 */
function fixedCycleLength(source: CycleSource): number | null {
	if (source.timerMode === COUNTER_TIMER_MODE.Date) {
		return source.targetAt.getTime() - source.startAt.getTime();
	}
	const { months, weeks, days, hours, minutes } = source.duration;
	if (months || weeks || days) return null;
	return (hours * SECONDS_PER_HOUR + minutes * SECONDS_PER_MINUTE) * MS_PER_SECOND;
}

/** Состояние таймера, из которого вычисляется окончание цикла. */
interface CycleState extends CycleSource {
	value: number;
	autoRestart: boolean;
}

/** Результат окончания цикла: новое число, текущий цикл и его статус. */
interface FinishedCycle {
	value: number;
	startAt: Date;
	targetAt: Date;
	status: CounterTimerStatus;
	/** Конец последнего завершённого цикла. */
	finishedAt: Date;
}

/**
 * Окончание цикла (`targetAt` наступил): число +1. С автоповтором следующий цикл начинается
 * в момент окончания прошлого, а циклы, целиком прошедшие к `now` (воркер был выключен),
 * досчитываются сразу: при постоянной длине цикла — делением, при календарном сроке —
 * перебором, не больше `COUNTER_CATCH_UP_MAX` за раз (остальные — в следующий проход).
 */
export function finishCycle(state: CycleState, now: Date, timeZone: string): FinishedCycle {
	if (!state.autoRestart) {
		return {
			value: state.value + 1,
			startAt: state.startAt,
			targetAt: state.targetAt,
			status: COUNTER_TIMER_STATUS.Finished,
			finishedAt: state.targetAt,
		};
	}

	const length = fixedCycleLength(state);
	if (length !== null && length > 0) {
		// Закончились текущий цикл и ещё столько целых, сколько уложилось до `now`.
		const completed = Math.floor((now.getTime() - state.targetAt.getTime()) / length) + 1;
		const finishedAt = new Date(state.targetAt.getTime() + (completed - 1) * length);
		return {
			value: state.value + completed,
			startAt: finishedAt,
			targetAt: new Date(finishedAt.getTime() + length),
			status: COUNTER_TIMER_STATUS.Running,
			finishedAt,
		};
	}

	let cycle = { startAt: state.startAt, targetAt: state.targetAt };
	let value = state.value;
	let finishedAt = state.targetAt;
	for (let step = 0; step < COUNTER_CATCH_UP_MAX && cycle.targetAt <= now; step++) {
		value++;
		finishedAt = cycle.targetAt;
		cycle = nextCycle(state, cycle.targetAt, timeZone);
	}
	return { value, ...cycle, status: COUNTER_TIMER_STATUS.Running, finishedAt };
}
