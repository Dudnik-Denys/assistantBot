import { COUNTER_TIMER_STATUS } from '@tgab/core/constants/counters';
import { api, type CounterDto } from '#lib/api.ts';
import { removeWithConfirm } from '#lib/feedback.ts';

/** Число на экране: при ручном управлении — всегда, иначе — по настройке «Показывать счёт». */
export function isValueVisible(counter: CounterDto): boolean {
	return counter.manual || counter.showValue;
}

/** Таймер идёт: цикл не закончился. */
export function isRunning(counter: CounterDto): boolean {
	return counter.timer?.status === COUNTER_TIMER_STATUS.Running;
}

/** Таймер на паузе («Стоп», «Сбросить»): отсчёт замер, ждёт «Старт». */
export function isPaused(counter: CounterDto): boolean {
	return counter.timer?.status === COUNTER_TIMER_STATUS.Paused;
}

/** Цикл закончился и ждёт «Старт». */
export function isFinished(counter: CounterDto): boolean {
	return counter.timer?.status === COUNTER_TIMER_STATUS.Finished;
}

/** Время цикла вышло, а сервер ещё отдаёт его идущим: пора `api.counters.finish`. */
export function isDue(counter: CounterDto, now: number): boolean {
	return isRunning(counter) && !!counter.timer && new Date(counter.timer.targetAt).getTime() <= now;
}

/** Список, где счётчики из `updated` заменены новыми версиями (по `id`). */
export function replaceCounters(items: CounterDto[], updated: CounterDto[]): CounterDto[] {
	const byId = new Map(updated.map((counter) => [counter.id, counter]));
	return items.map((counter) => byId.get(counter.id) ?? counter);
}

/** Момент, на котором стоит отсчёт таймера (мс): у паузы — её начало, иначе — `now`. */
export function timerMoment(counter: CounterDto, now: number): number {
	const pausedAt = counter.timer?.pausedAt;
	return pausedAt ? new Date(pausedAt).getTime() : now;
}

/** Спросить подтверждение и удалить счётчик. true — удалён. */
export function removeCounter(counter: CounterDto): Promise<boolean> {
	return removeWithConfirm(`счётчик «${counter.title}»`, () => api.counters.remove(counter.id));
}
