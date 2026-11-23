import { NOTIFICATION_SCREEN_PATH } from '@tgab/core/constants/notifications';
import { InlineKeyboard } from 'grammy';

/** Кнопка, открывающая уведомление в Mini App (раздел «Напоминания»). */
export function openNotificationKeyboard(
	miniAppUrl: string,
	notificationId: string,
): InlineKeyboard {
	// Относительный путь — от адреса Mini App (он может быть с подпапкой).
	const base = miniAppUrl.endsWith('/') ? miniAppUrl : `${miniAppUrl}/`;
	const url = new URL(`${NOTIFICATION_SCREEN_PATH}${notificationId}`, base);
	return new InlineKeyboard().webApp('Открыть уведомление', url.toString());
}
