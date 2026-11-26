import { describe, expect, test } from 'bun:test';
import type { NotificationDelivery, NotificationsService } from '@tgab/core';
import { type Job, UnrecoverableError } from 'bullmq';
import { type Api, GrammyError, HttpError } from 'grammy';
import { createCounterNotificationJob } from '#worker/jobs/counter-notification.ts';

// Задача воркера `jobs/counter-notification.ts`: сервис уведомлений и Bot API — подмены.

const NOTIFICATION_ID = '0198c2a4-5b6e-7c3d-8e9f-0a1b2c3d4e5f';
const MINI_APP_URL = 'https://app.example.com/';
const DELIVERY: NotificationDelivery = {
	notificationId: NOTIFICATION_ID,
	telegramId: 777_000n,
	counterTitle: 'Вода',
	cycle: 3,
	showValue: true,
	autoRestart: false,
};

function telegramError(errorCode: number): GrammyError {
	return new GrammyError(
		'Call to sendMessage failed',
		{ ok: false, error_code: errorCode, description: `Ошибка ${errorCode}` },
		'sendMessage',
		{},
	);
}

/**
 * Подмены: `delivery` — что вернёт `getDelivery`, `sendError` — чем упадёт отправка, `miniAppUrl:
 * null` — адрес Mini App не задан (`undefined` подставил бы значение по умолчанию).
 */
function setup({
	delivery = DELIVERY as NotificationDelivery | null,
	sendError = undefined as unknown,
	miniAppUrl = MINI_APP_URL as string | null,
} = {}) {
	const marks: string[] = [];
	const sent: { chatId: number; text: string; options: Record<string, unknown> }[] = [];
	const notifications = {
		getDelivery: async () => delivery,
		markSent: async () => {
			marks.push('sent');
		},
		markUndeliverable: async () => {
			marks.push('undeliverable');
		},
	};
	const api = {
		sendMessage: async (chatId: number, text: string, options: Record<string, unknown>) => {
			if (sendError) throw sendError;
			sent.push({ chatId, text, options });
		},
	};
	// Подмены содержат только то, что вызывает задача: настоящий сервис ходил бы в БД, Api — в Telegram.
	const job = createCounterNotificationJob({
		notifications: notifications as unknown as NotificationsService,
		api: api as unknown as Api,
		miniAppUrl: miniAppUrl ?? undefined,
	});
	// Из задачи BullMQ обработчик читает только `data`.
	const run = (data: unknown = { notificationId: NOTIFICATION_ID }) => job({ data } as Job);
	return { run, marks, sent };
}

describe('отправка', () => {
	test('Сообщение пользователю с кнопкой и отметка отправленным', async () => {
		const { run, marks, sent } = setup();
		await run();
		expect(sent).toHaveLength(1);
		expect(sent[0]?.chatId).toBe(Number(DELIVERY.telegramId));
		expect(sent[0]?.text).toContain(DELIVERY.counterTitle);
		expect(sent[0]?.options.parse_mode).toBe('HTML');
		expect(JSON.stringify(sent[0]?.options.reply_markup)).toContain(NOTIFICATION_ID);
		expect(marks).toEqual(['sent']);
	});

	test('Без адреса Mini App — сообщение без кнопки', async () => {
		const { run, sent } = setup({ miniAppUrl: null });
		await run();
		expect(sent[0]?.options.reply_markup).toBeUndefined();
	});

	test('Удалённое или уже отправленное уведомление не отправляется', async () => {
		const { run, marks, sent } = setup({ delivery: null });
		await run();
		expect(sent).toEqual([]);
		expect(marks).toEqual([]);
	});

	test('Отклонение данных задачи не той формы без отправки', async () => {
		const { run, sent } = setup();
		await expect(run({ notificationId: 'не uuid' })).rejects.toThrow();
		expect(sent).toEqual([]);
	});
});

describe('ошибки Telegram', () => {
	for (const code of [400, 403]) {
		test(`${code} — отметка недоставляемым и задача без повторов`, async () => {
			const { run, marks } = setup({ sendError: telegramError(code) });
			await expect(run()).rejects.toThrow(UnrecoverableError);
			expect(marks).toEqual(['undeliverable']);
		});
	}

	test('401 — задача без повторов, но уведомление не помечается', async () => {
		const { run, marks } = setup({ sendError: telegramError(401) });
		await expect(run()).rejects.toThrow(UnrecoverableError);
		expect(marks).toEqual([]);
	});

	test('Временные ошибки Telegram и сети — для повтора, без отметок', async () => {
		for (const sendError of [
			telegramError(429),
			telegramError(500),
			new HttpError('Network request failed', new Error('ECONNRESET')),
		]) {
			const { run, marks } = setup({ sendError });
			const error = await run().catch((caught: unknown) => caught);
			expect(error).toBe(sendError);
			expect(error).not.toBeInstanceOf(UnrecoverableError);
			expect(marks).toEqual([]);
		}
	});
});
