import type { CounterNotification, PrismaClient } from '@tgab/db';
import { assertId } from '../common/id.ts';
import { COUNTER_TIMER_STATUS, type CounterTimerStatus } from '../constants/counters.ts';
import { LIST_LIMIT_MAX } from '../constants/list.ts';
import {
	NOTIFICATION_RESEND_BATCH_SIZE,
	NOTIFICATION_RESEND_WINDOW_MS,
} from '../constants/notifications.ts';
import { NotFoundError } from '../errors.ts';
import type { NotificationDelivery, NotificationDto } from './types.ts';

const NOT_FOUND = 'Уведомление не найдено';

const include = {
	counter: { select: { id: true, title: true, timerStatus: true, repeatSame: true } },
} as const;

type NotificationRow = CounterNotification & {
	counter: {
		id: string;
		title: string;
		timerStatus: CounterTimerStatus | null;
		repeatSame: boolean;
	};
};

export function toNotificationDto(row: NotificationRow): NotificationDto {
	return {
		id: row.id,
		cycle: row.cycle,
		finishedAt: row.finishedAt.toISOString(),
		readAt: row.readAt?.toISOString() ?? null,
		createdAt: row.createdAt.toISOString(),
		counter: {
			id: row.counter.id,
			title: row.counter.title,
			finished: row.counter.timerStatus === COUNTER_TIMER_STATUS.Finished,
			repeatSame: row.counter.repeatSame,
		},
	};
}

/**
 * Уведомления раздела «Напоминания»: пока — об окончании циклов счётчиков (создаёт их
 * `counters.processDue`). Методы пользовательских данных принимают userId явно.
 */
export function createNotificationsService(db: PrismaClient) {
	return {
		/** Новые сверху. */
		async list(userId: string): Promise<NotificationDto[]> {
			const rows = await db.counterNotification.findMany({
				where: { userId },
				orderBy: { createdAt: 'desc' },
				take: LIST_LIMIT_MAX,
				include,
			});
			return rows.map(toNotificationDto);
		},

		async get(userId: string, id: string): Promise<NotificationDto> {
			assertId(id, NOT_FOUND);
			const row = await db.counterNotification.findFirst({ where: { id, userId }, include });
			if (!row) throw new NotFoundError(NOT_FOUND);
			return toNotificationDto(row);
		},

		/** Отметить прочитанным (повторный вызов время прочтения не меняет). */
		async markRead(userId: string, id: string): Promise<NotificationDto> {
			assertId(id, NOT_FOUND);
			await db.counterNotification.updateMany({
				where: { id, userId, readAt: null },
				data: { readAt: new Date() },
			});
			return this.get(userId, id);
		},

		async remove(userId: string, id: string): Promise<void> {
			assertId(id, NOT_FOUND);
			const { count } = await db.counterNotification.deleteMany({ where: { id, userId } });
			if (count === 0) throw new NotFoundError(NOT_FOUND);
		},

		/**
		 * Для воркера (outbox): id уведомлений, сообщение о которых ещё не отправлено, —
		 * не старше `NOTIFICATION_RESEND_WINDOW_MS`, старые сначала.
		 */
		async listUnsent(now: Date): Promise<string[]> {
			const rows = await db.counterNotification.findMany({
				where: {
					sentAt: null,
					deliveryFailedAt: null,
					createdAt: { gte: new Date(now.getTime() - NOTIFICATION_RESEND_WINDOW_MS) },
				},
				orderBy: { createdAt: 'asc' },
				take: NOTIFICATION_RESEND_BATCH_SIZE,
				select: { id: true },
			});
			return rows.map((row) => row.id);
		},

		/** Для воркера: сообщение отправлено — больше не досылать. */
		async markSent(id: string): Promise<void> {
			assertId(id, NOT_FOUND);
			await db.counterNotification.updateMany({
				where: { id, sentAt: null },
				data: { sentAt: new Date() },
			});
		},

		/**
		 * Для воркера: сообщение не доставить никогда (пользователь заблокировал бота) —
		 * больше не досылать. Уведомление остаётся в Mini App.
		 */
		async markUndeliverable(id: string): Promise<void> {
			assertId(id, NOT_FOUND);
			await db.counterNotification.updateMany({
				where: { id, sentAt: null },
				data: { deliveryFailedAt: new Date() },
			});
		},

		/**
		 * Для воркера (любой пользователь): данные сообщения в Telegram. null — отправлять
		 * нечего: уведомление удалили (вместе со счётчиком или вручную), уже отправили или доставить нельзя.
		 */
		async getDelivery(id: string): Promise<NotificationDelivery | null> {
			assertId(id, NOT_FOUND);
			const row = await db.counterNotification.findFirst({
				where: { id, sentAt: null, deliveryFailedAt: null },
				select: {
					id: true,
					cycle: true,
					user: { select: { telegramId: true } },
					counter: {
						select: { title: true, showValue: true, manual: true, autoRestart: true },
					},
				},
			});
			if (!row) return null;
			return {
				notificationId: row.id,
				telegramId: row.user.telegramId,
				counterTitle: row.counter.title,
				cycle: row.cycle,
				showValue: row.counter.showValue || row.counter.manual,
				autoRestart: row.counter.autoRestart,
			};
		},
	};
}

export type NotificationsService = ReturnType<typeof createNotificationsService>;
