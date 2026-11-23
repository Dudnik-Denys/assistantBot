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

/** Цикл закончился и ждёт «Продолжить». */
export function isFinished(counter: CounterDto): boolean {
	return counter.timer?.status === COUNTER_TIMER_STATUS.Finished;
}

/** Спросить подтверждение и удалить счётчик. true — удалён. */
export function removeCounter(counter: CounterDto): Promise<boolean> {
	return removeWithConfirm(`счётчик «${counter.title}»`, () => api.counters.remove(counter.id));
}
