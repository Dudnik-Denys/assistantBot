import { COUNTER_TIMER_MODE } from '@tgab/core/constants/counters';

// Константы раздела «Счётчики» Mini App (только для него).

/** Вкладки списка счётчиков. */
export const COUNTER_TABS = [
	{ value: 'all', label: 'Все' },
	{ value: 'running', label: 'Запущенные' },
	{ value: 'finished', label: 'Завершённые' },
] as const;

export type CounterTab = (typeof COUNTER_TABS)[number]['value'];

/** Сообщение пустой вкладки. */
export const COUNTER_EMPTY_TAB_MESSAGES: Record<Exclude<CounterTab, 'all'>, string> = {
	running: 'Сейчас нет запущенных счётчиков',
	finished: 'Нет счётчиков, которые ждут продолжения',
};

/** Режим формы «Без таймера» (счётчик только ручной) — в API это `timer: null`. */
export const COUNTER_NO_TIMER = 'NONE';

/** Режимы таймера в форме. */
export const COUNTER_TIMER_MODES = [
	{ value: COUNTER_NO_TIMER, label: 'Без таймера' },
	{ value: COUNTER_TIMER_MODE.Duration, label: 'На срок' },
	{ value: COUNTER_TIMER_MODE.Date, label: 'До даты' },
] as const;

export type CounterTimerModeOption = (typeof COUNTER_TIMER_MODES)[number]['value'];

/** Части срока в форме — в порядке полей. */
export const COUNTER_DURATION_FIELDS = [
	{ part: 'months', label: 'Мес.' },
	{ part: 'weeks', label: 'Нед.' },
	{ part: 'days', label: 'Дни' },
	{ part: 'hours', label: 'Часы' },
	{ part: 'minutes', label: 'Мин.' },
] as const;

/**
 * Через сколько после окончания цикла на экране перезапросить счётчик: окончание обрабатывает
 * воркер раз в минуту, до этого сервер ещё отдаёт идущий цикл.
 */
export const COUNTER_REFRESH_DELAY_MS = 10_000;

/** Ключ зависимости `load` экрана счётчика: `invalidate(COUNTER_DEPENDENCY)` — перезапрос. */
export const COUNTER_DEPENDENCY = 'app:counter';
