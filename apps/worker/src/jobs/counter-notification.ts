import type { NotificationsService } from '@tgab/core';
import { type Job, UnrecoverableError } from 'bullmq';
import { type Api, GrammyError } from 'grammy';
import { z } from 'zod';
import {
	TELEGRAM_UNAUTHORIZED_CODE,
	TELEGRAM_UNDELIVERABLE_CODES,
} from '#worker/constants/telegram.ts';
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
		const parsed = NotificationJobDataSchema.safeParse(job.data);
		// Данные задачи не той формы повтор не исправит — сразу без повторов.
		if (!parsed.success) {
			throw new UnrecoverableError(`Данные задачи не той формы: ${z.prettifyError(parsed.error)}`);
		}
		const { notificationId } = parsed.data;
		// Уведомление удалили (вместе со счётчиком) или уже отправили — делать нечего.
		const delivery = await notifications.getDelivery(notificationId);
		if (!delivery) return;
		try {
			await api.sendMessage(Number(delivery.telegramId), counterFinishedMessage(delivery), {
				parse_mode: 'HTML',
				reply_markup: miniAppUrl ? openNotificationKeyboard(miniAppUrl, notificationId) : undefined,
			});
		} catch (error) {
			if (!(error instanceof GrammyError)) throw error;
			// Этому пользователю не доставить (бот заблокирован, чат не найден): повторы не помогут —
			// пометить, чтобы outbox больше не досылал. Уведомление остаётся в Mini App.
			if (TELEGRAM_UNDELIVERABLE_CODES.includes(error.error_code)) {
				await notifications.markUndeliverable(notificationId);
				throw new UnrecoverableError(`Сообщение не доставлено: ${error.description}`);
			}
			// Неверный токен — сбой настройки, а не пользователя: без повторов и без пометки.
			if (error.error_code === TELEGRAM_UNAUTHORIZED_CODE) {
				throw new UnrecoverableError(`Telegram отклонил токен бота: ${error.description}`);
			}
			throw error;
		}
		await notifications.markSent(notificationId);
	};
}
