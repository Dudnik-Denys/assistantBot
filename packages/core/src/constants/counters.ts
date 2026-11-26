// Константы счётчиков. Файл без зависимостей: его импортирует и сервер (схема, таймер),
// и Mini App (лимиты полей, время по умолчанию) — через вход `@tgab/core/constants/counters`.

/** Длина названия: оно — заголовок экрана счётчика и должно помещаться в пару строк. */
export const COUNTER_TITLE_MAX = 30;

/**
 * Режим таймера: на срок (длительность от старта) или до даты. Значения совпадают с enum
 * `CounterTimerMode` в схеме Prisma — в БД и в API одни и те же строки.
 */
export const COUNTER_TIMER_MODE = { Duration: 'DURATION', Date: 'DATE' } as const;

export type CounterTimerMode = (typeof COUNTER_TIMER_MODE)[keyof typeof COUNTER_TIMER_MODE];

/**
 * Состояние таймера: цикл идёт, стоит на паузе («Стоп», «Сбросить») или закончился и ждёт
 * «Старт». Значения совпадают с enum `CounterTimerStatus` в схеме Prisma.
 */
export const COUNTER_TIMER_STATUS = {
	Running: 'RUNNING',
	Paused: 'PAUSED',
	Finished: 'FINISHED',
} as const;

export type CounterTimerStatus = (typeof COUNTER_TIMER_STATUS)[keyof typeof COUNTER_TIMER_STATUS];

/** Текст ошибки: счётчик без названия. */
export const COUNTER_TITLE_REQUIRED_MESSAGE = 'Укажите название';

/** Текст ошибки: название длиннее `COUNTER_TITLE_MAX`. */
export const COUNTER_TITLE_TOO_LONG_MESSAGE = `Название — не длиннее ${COUNTER_TITLE_MAX} символов`;

/** Число нового счётчика и число после «Сбросить». */
export const COUNTER_INITIAL_VALUE = 0;
/** Ниже число не опускается кнопкой «−». */
export const COUNTER_VALUE_MIN = 0;

/** Время старта или окончания цикла, которое форма предлагает по умолчанию (`HH:mm`). */
export const COUNTER_DEFAULT_TIME = '12:00';

/** Текст ошибки: дата и время не в формате `2026-11-24T12:00`. */
export const LOCAL_DATE_TIME_MESSAGE = 'Некорректные дата и время';

/** Части срока цикла — в порядке от крупной к мелкой (поля формы, колонки БД). */
export const COUNTER_DURATION_PARTS = ['months', 'weeks', 'days', 'hours', 'minutes'] as const;

/** Нулевой срок: у таймера «до даты» и в новой форме. */
export const COUNTER_EMPTY_DURATION: Readonly<
	Record<(typeof COUNTER_DURATION_PARTS)[number], number>
> = { months: 0, weeks: 0, days: 0, hours: 0, minutes: 0 };

/** Наибольшее значение одной части срока (месяцев, недель, дней, часов, минут). */
export const COUNTER_DURATION_PART_MAX = 9_999;

/** Текст ошибки: таймер на срок, но все части срока — ноль. */
export const COUNTER_DURATION_REQUIRED_MESSAGE = 'Укажите срок больше нуля';

/** Текст ошибки: конец цикла уже прошёл (по времени пользователя). */
export const COUNTER_TARGET_PASSED_MESSAGE =
	'Время окончания уже прошло — выберите время в будущем';

/** Текст ошибки: таймер на срок со своим стартом, но дата и время старта не указаны. */
export const COUNTER_START_REQUIRED_MESSAGE = 'Укажите дату и время старта';

/** Текст ошибки: таймер до даты, но дата или время окончания не указаны. */
export const COUNTER_TARGET_REQUIRED_MESSAGE = 'Укажите дату и время окончания';

/** Текст ошибки: «Старт» без «тех же параметров» — нужен новый срок или дата. */
export const COUNTER_RESTART_NEEDS_PARAMS_MESSAGE =
	'Задайте новую дату или срок в настройках счётчика';

/** Текст ошибки: «Старт» у счётчика без таймера. */
export const COUNTER_NO_TIMER_MESSAGE = 'У счётчика нет таймера';

/** Текст ошибки: «Старт» у таймера, который уже идёт. */
export const COUNTER_ALREADY_RUNNING_MESSAGE = 'Таймер счётчика уже идёт';

/** Текст ошибки: «Стоп» у таймера, который не идёт (на паузе, закончился или таймера нет). */
export const COUNTER_NOT_RUNNING_MESSAGE = 'Таймер счётчика сейчас не идёт';

/** Сколько наступивших счётчиков воркер берёт за один проход (каждый — в своей транзакции). */
export const COUNTER_DUE_BATCH_SIZE = 50;

/** Таймаут транзакции окончания цикла одного счётчика (по умолчанию у Prisma — 5 с). */
export const COUNTER_TRANSACTION_TIMEOUT_MS = 10_000;

/**
 * Сколько пропущенных циклов автоповтора с календарным сроком (месяцы, недели, дни) досчитывается
 * перебором за раз; остальные — в следующий проход. Срок из одних часов и минут и таймер «до
 * даты» досчитываются делением, без перебора.
 */
export const COUNTER_CATCH_UP_MAX = 1_000;
