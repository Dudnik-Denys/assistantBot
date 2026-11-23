import type { CountersService, NotificationsService } from '@tgab/core';
import { COUNTER_DUE_BATCH_SIZE } from '@tgab/core/constants/counters';
import type { Queue } from 'bullmq';
import {
	JobName,
	NOTIFICATION_JOB_ID_PREFIX,
	NOTIFICATION_JOB_OPTIONS,
} from '#worker/constants/queues.ts';
import type { NotificationJobData } from '#worker/schemas/jobs.ts';

interface CountersDueDeps {
	counters: CountersService;
	notifications: NotificationsService;
	notificationsQueue: Queue<NotificationJobData>;
}

/**
 * Раз в минуту:
 * 1. Окончание наступивших циклов счётчиков (`counters.processDue`): каждый счётчик — в своей
 *    транзакции, уведомление пишется в БД вместе с ним. Полная пачка — могут быть ещё.
 * 2. Outbox: уведомления без `sentAt` ставятся в очередь отправки. `jobId` из id уведомления —
 *    повтор не дублирует сообщение; запись уже в БД, поэтому задача её всегда найдёт, а сбой
 *    Redis или процесса лишь откладывает отправку до следующего прохода.
 */
export function createCountersDueJob({
	counters,
	notifications,
	notificationsQueue,
}: CountersDueDeps) {
	return async (): Promise<void> => {
		const now = new Date();
		while ((await counters.processDue(now)) === COUNTER_DUE_BATCH_SIZE) {
			// Следующая пачка: в этой могли быть не все наступившие.
		}

		const unsent = await notifications.listUnsent(now);
		if (unsent.length === 0) return;
		await notificationsQueue.addBulk(
			unsent.map((notificationId) => ({
				name: JobName.SendCounterNotification,
				data: { notificationId },
				opts: {
					...NOTIFICATION_JOB_OPTIONS,
					jobId: `${NOTIFICATION_JOB_ID_PREFIX}-${notificationId}`,
				},
			})),
		);
	};
}
