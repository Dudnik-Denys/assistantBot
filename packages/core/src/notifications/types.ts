/** Уведомление об окончании цикла счётчика в ответе API: даты — ISO-строки. */
export interface NotificationDto {
	id: string;
	/** Число счётчика после этого цикла («Циклов пройдено»). */
	cycle: number;
	/** Когда закончился цикл. */
	finishedAt: string;
	/** null — не прочитано. */
	readAt: string | null;
	createdAt: string;
	counter: {
		id: string;
		title: string;
		/** Цикл закончился и ждёт «Продолжить» (без автоповтора). */
		finished: boolean;
		/** «Продолжить» сразу, с теми же параметрами; иначе — через настройки счётчика. */
		repeatSame: boolean;
	};
}

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
