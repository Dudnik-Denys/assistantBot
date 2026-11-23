import type { JobsOptions } from 'bullmq';

/** Очереди BullMQ. */
export const QueueName = {
	/** Периодическая выборка счётчиков, цикл которых закончился. */
	CountersDue: 'counters-due',
	/** Отправка сообщений в Telegram. */
	Notifications: 'notifications',
} as const;

/** Имена задач внутри очередей. */
export const JobName = {
	ProcessDueCounters: 'process-due-counters',
	SendCounterNotification: 'send-counter-notification',
} as const;

/** Повторяющаяся задача выборки счётчиков (id планировщика BullMQ). */
export const COUNTERS_DUE_SCHEDULER_ID = 'counters-due-every-minute';
/** Как часто выбираются закончившиеся циклы. */
export const COUNTERS_DUE_INTERVAL_MS = 60_000;

/** Префикс id задачи отправки: `<префикс>-<id уведомления>` — повтор не дублирует сообщение. */
export const NOTIFICATION_JOB_ID_PREFIX = 'counter-notification';

/** Не больше 25 сообщений в секунду — с запасом под лимит Telegram (~30/с на бота). */
export const NOTIFICATIONS_LIMITER = { max: 25, duration: 1_000 };

/**
 * Отправка: 5 попыток с растущей паузой (5 с, 10 с, 20 с…). Выполненные задачи хранятся сутки —
 * пока задача есть, повторная постановка с тем же `jobId` игнорируется. Упавшие не удаляются:
 * их видно в Redis.
 */
export const NOTIFICATION_JOB_OPTIONS: JobsOptions = {
	attempts: 5,
	backoff: { type: 'exponential', delay: 5_000 },
	removeOnComplete: { age: 86_400 },
	removeOnFail: false,
};

/** Выборка: задача повторяется раз в минуту, хранить выполненные незачем. */
export const COUNTERS_DUE_JOB_OPTIONS: JobsOptions = {
	removeOnComplete: true,
	removeOnFail: { count: 100 },
};
