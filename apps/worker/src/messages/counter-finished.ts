import { escapeHtml, type NotificationDelivery } from '@tgab/core';

/** Текст сообщения об окончании цикла счётчика (HTML). */
export function counterFinishedMessage(delivery: NotificationDelivery): string {
	const lines = [`⏰ Счётчик <b>${escapeHtml(delivery.counterTitle)}</b>: цикл завершён`];
	if (delivery.showValue) lines.push(`Циклов пройдено: ${delivery.cycle}`);
	lines.push(
		delivery.autoRestart ? 'Следующий цикл уже начался.' : 'Продолжить счётчик можно в приложении.',
	);
	return lines.join('\n');
}
