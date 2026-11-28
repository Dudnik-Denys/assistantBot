import { type COUNTER_DURATION_PARTS, COUNTER_TIMER_MODE } from '@tgab/core/constants/counters';

// Константы раздела «Счётчики» Mini App (только для него).

/** Вкладка «Все»: список без фильтра. */
export const COUNTER_TAB_ALL = 'all';

/**
 * Вкладки списка счётчиков. Подписи короткие: четыре сегмента в одну строку должны помещаться
 * и на телефоне шириной 375 pt (iPhone 12 mini — самый маленький, `ui.md`), иначе ряд `SegmentedControl` не поместится в ширину экрана.
 */
export const COUNTER_TABS = [
	{ value: COUNTER_TAB_ALL, label: 'Все' },
	{ value: 'running', label: 'Идут' },
	{ value: 'paused', label: 'Пауза' },
	{ value: 'finished', label: 'Завершены' },
] as const;

export type CounterTab = (typeof COUNTER_TABS)[number]['value'];

/** Сообщение пустой вкладки. */
export const COUNTER_EMPTY_TAB_MESSAGES: Record<
	Exclude<CounterTab, typeof COUNTER_TAB_ALL>,
	string
> = {
	running: 'Сейчас нет запущенных счётчиков',
	paused: 'Нет счётчиков на паузе',
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

/** Подписи полей срока в форме; набор и порядок частей — `COUNTER_DURATION_PARTS` из core. */
export const COUNTER_DURATION_LABELS: Record<(typeof COUNTER_DURATION_PARTS)[number], string> = {
	months: 'Мес.',
	weeks: 'Нед.',
	days: 'Дни',
	hours: 'Часы',
	minutes: 'Мин.',
};

/**
 * Повтор «завершить цикл» (`api.counters.finish`), если первый запрос не завершил его: цикл
 * в этот момент обрабатывал воркер или не было связи.
 */
export const COUNTER_REFRESH_DELAY_MS = 3_000;
