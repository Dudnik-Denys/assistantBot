import { MS_PER_MINUTE, MS_PER_SECOND, SECONDS_PER_DAY } from '@tgab/core/constants/time';
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
export const COUNTERS_DUE_INTERVAL_MS = MS_PER_MINUTE;
/**
 * Сколько пачек (`COUNTER_DUE_BATCH_SIZE`) выборка обрабатывает за один запуск: остальные —
 * через минуту. Предел не даёт задаче крутиться без конца, если записи пачки раз за разом
 * не завершаются (заняты другим процессом или падают).
 */
export const COUNTERS_DUE_MAX_PASSES = 20;

/** Префикс id задачи отправки: `<префикс>-<id уведомления>` — повтор не дублирует сообщение. */
export const NOTIFICATION_JOB_ID_PREFIX = 'counter-notification';

/** Не больше 25 сообщений в секунду — с запасом под лимит Telegram (~30/с на бота). */
export const NOTIFICATIONS_LIMITER = { max: 25, duration: MS_PER_SECOND };

/** Сколько хранятся упавшие задачи отправки — чтобы разобрать, что и почему не ушло. */
const NOTIFICATION_FAILED_KEEP_SECONDS = 7 * SECONDS_PER_DAY;

/**
 * Отправка: 5 попыток с растущей паузой (5 с, 10 с, 20 с…). Выполненные задачи хранятся сутки —
 * пока задача есть, повторная постановка с тем же `jobId` игнорируется. Упавшие после всех
 * попыток хранятся неделю (видно в Redis, что и почему не ушло); пока запись в окне досылки,
 * outbox перед новой постановкой удаляет упавшую задачу (`jobs/counters-due.ts`) — иначе её
 * `jobId` заблокировал бы повтор.
 */
export const NOTIFICATION_JOB_OPTIONS: JobsOptions = {
	attempts: 5,
	backoff: { type: 'exponential', delay: 5 * MS_PER_SECOND },
	removeOnComplete: { age: SECONDS_PER_DAY },
	removeOnFail: { age: NOTIFICATION_FAILED_KEEP_SECONDS },
};

/** Сколько ждать завершения текущих задач при остановке, прежде чем выйти принудительно. */
export const WORKER_SHUTDOWN_TIMEOUT_MS = 30 * MS_PER_SECOND;

/** Выборка: задача повторяется раз в минуту, хранить выполненные незачем. */
export const COUNTERS_DUE_JOB_OPTIONS: JobsOptions = {
	removeOnComplete: true,
	removeOnFail: { count: 100 },
};
