import type { CountersService, NotificationsService } from '@tgab/core';
import { COUNTER_DUE_BATCH_SIZE } from '@tgab/core/constants/counters';
import type { Queue } from 'bullmq';
import {
	COUNTERS_DUE_MAX_PASSES,
	JobName,
	NOTIFICATION_JOB_ID_PREFIX,
	NOTIFICATION_JOB_OPTIONS,
} from '#worker/constants/queues.ts';
import type { NotificationJobData } from '#worker/schemas/jobs.ts';

/** Удалить задачу с этим id, если она упала после всех попыток; идущую или ждущую — не трогать. */
async function removeFailedJob(queue: Queue, jobId: string): Promise<void> {
	const job = await queue.getJob(jobId);
	if (job && (await job.isFailed())) await job.remove();
}

interface CountersDueDeps {
	counters: CountersService;
	notifications: NotificationsService;
	notificationsQueue: Queue<NotificationJobData>;
}

/**
 * Раз в минуту:
 * 1. Окончание наступивших циклов счётчиков (`counters.processDue`): каждый счётчик — в своей
 *    транзакции, уведомление пишется в БД вместе с ним; ошибка одного не мешает остальным.
 *    Полная пачка, в которой что-то завершилось, — могут быть ещё (не больше
 *    `COUNTERS_DUE_MAX_PASSES` пачек за запуск).
 * 2. Outbox: уведомления без `sentAt` ставятся в очередь отправки. `jobId` из id уведомления —
 *    повтор не дублирует сообщение; упавшая после всех попыток задача удаляется перед новой
 *    постановкой. Запись уже в БД, поэтому задача её всегда найдёт, а сбой Redis, процесса или
 *    Telegram лишь откладывает отправку до следующего прохода.
 */
export function createCountersDueJob({
	counters,
	notifications,
	notificationsQueue,
}: CountersDueDeps) {
	return async (): Promise<void> => {
		const now = new Date();
		for (let pass = 0; pass < COUNTERS_DUE_MAX_PASSES; pass++) {
			const { selected, finished, failed } = await counters.processDue(now);
			for (const { id, error } of failed) {
				console.error(`Счётчик ${id}: окончание цикла не обработано:`, error);
			}
			// Неполная пачка — наступившие кончились; ничего не завершилось — следующая выборка
			// вернёт те же записи, ждём следующего запуска.
			if (selected < COUNTER_DUE_BATCH_SIZE || finished === 0) break;
		}

		const unsent = await notifications.listUnsent(now);
		if (unsent.length === 0) return;
		const jobs = unsent.map((notificationId) => ({
			name: JobName.SendCounterNotification,
			data: { notificationId },
			opts: {
				...NOTIFICATION_JOB_OPTIONS,
				jobId: `${NOTIFICATION_JOB_ID_PREFIX}-${notificationId}`,
			},
		}));
		// Упавшая после всех попыток задача хранится (её видно в Redis) и своим jobId
		// заблокировала бы повторную постановку — убрать её, чтобы outbox дослал уведомление.
		for (const { opts } of jobs) await removeFailedJob(notificationsQueue, opts.jobId);
		await notificationsQueue.addBulk(jobs);
	};
}
