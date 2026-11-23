import type { NotificationsService } from '@tgab/core';
import { type Job, UnrecoverableError } from 'bullmq';
import { type Api, GrammyError } from 'grammy';
import { TELEGRAM_FORBIDDEN_CODE } from '#worker/constants/telegram.ts';
import { openNotificationKeyboard } from '#worker/keyboards/open-notification.ts';
import { counterFinishedMessage } from '#worker/messages/counter-finished.ts';
import { NotificationJobDataSchema } from '#worker/schemas/jobs.ts';

interface CounterNotificationDeps {
	notifications: NotificationsService;
	api: Api;
	/** Адрес Mini App для кнопки «Открыть уведомление»; нет — сообщение без кнопки. */
	miniAppUrl?: string;
}

/** Отправка сообщения об окончании цикла счётчика в Telegram. */
export function createCounterNotificationJob({
	notifications,
	api,
	miniAppUrl,
}: CounterNotificationDeps) {
	return async (job: Job): Promise<void> => {
		const { notificationId } = NotificationJobDataSchema.parse(job.data);
		// Уведомление удалили (вместе со счётчиком) или уже отправили — делать нечего.
		const delivery = await notifications.getDelivery(notificationId);
		if (!delivery) return;
		try {
			await api.sendMessage(Number(delivery.telegramId), counterFinishedMessage(delivery), {
				parse_mode: 'HTML',
				reply_markup: miniAppUrl ? openNotificationKeyboard(miniAppUrl, notificationId) : undefined,
			});
		} catch (error) {
			// Бот заблокирован: повторы не помогут — пометить, чтобы outbox больше не досылал.
			// Уведомление остаётся в Mini App.
			if (error instanceof GrammyError && error.error_code === TELEGRAM_FORBIDDEN_CODE) {
				await notifications.markUndeliverable(notificationId);
				throw new UnrecoverableError(`Сообщение не доставлено: ${error.description}`);
			}
			throw error;
		}
		await notifications.markSent(notificationId);
	};
}
