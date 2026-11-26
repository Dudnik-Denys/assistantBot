export type { NotificationDto } from '../schemas/notifications/notification-dto.ts';

/** Всё для сообщения в Telegram об окончании цикла (воркер). */
export interface NotificationDelivery {
	notificationId: string;
	telegramId: bigint;
	counterTitle: string;
	cycle: number;
	/** Показывать ли число в сообщении (как на экране счётчика). */
	showValue: boolean;
	/** Следующий цикл уже идёт (автоповтор). */
	autoRestart: boolean;
}
