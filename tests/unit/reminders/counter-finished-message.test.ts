import { describe, expect, test } from 'bun:test';
import type { NotificationDelivery } from '@tgab/core';
import { NOTIFICATION_SCREEN_PATH } from '#core/constants/notifications.ts';
import { openNotificationKeyboard } from '#worker/keyboards/open-notification.ts';
import { counterFinishedMessage } from '#worker/messages/counter-finished.ts';

// Сообщение воркера об окончании цикла и кнопка открытия уведомления.

const NOTIFICATION_ID = '0198c2a4-5b6e-7c3d-8e9f-0a1b2c3d4e5f';
const DELIVERY: NotificationDelivery = {
	notificationId: NOTIFICATION_ID,
	telegramId: 777_000n,
	counterTitle: 'Вода',
	cycle: 3,
	showValue: true,
	autoRestart: false,
};

describe('counterFinishedMessage', () => {
	test('Название жирным с экранированием HTML', () => {
		const message = counterFinishedMessage({ ...DELIVERY, counterTitle: '<Сок & вода>' });
		expect(message).toContain('<b>&lt;Сок &amp; вода&gt;</b>');
	});

	test('Число циклов — только если его показывают', () => {
		expect(counterFinishedMessage(DELIVERY)).toContain(`Циклов пройдено: ${DELIVERY.cycle}`);
		expect(counterFinishedMessage({ ...DELIVERY, showValue: false })).not.toContain('Циклов');
	});

	test('Подсказка зависит от автоповтора', () => {
		expect(counterFinishedMessage(DELIVERY)).toContain('в приложении');
		expect(counterFinishedMessage({ ...DELIVERY, autoRestart: true })).toContain('уже начался');
	});
});

describe('openNotificationKeyboard', () => {
	function buttonUrl(miniAppUrl: string): string | undefined {
		const button = openNotificationKeyboard(miniAppUrl, NOTIFICATION_ID).inline_keyboard[0]?.[0];
		return button && 'web_app' in button ? button.web_app?.url : undefined;
	}

	test('Адрес экрана уведомления от адреса Mini App со слешем и без', () => {
		const expected = `https://app.example.com/${NOTIFICATION_SCREEN_PATH}${NOTIFICATION_ID}`;
		expect(buttonUrl('https://app.example.com/')).toBe(expected);
		expect(buttonUrl('https://app.example.com')).toBe(expected);
	});

	test('Подпапка в адресе Mini App сохраняется', () => {
		expect(buttonUrl('https://example.com/app')).toBe(
			`https://example.com/app/${NOTIFICATION_SCREEN_PATH}${NOTIFICATION_ID}`,
		);
	});
});
