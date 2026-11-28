import { afterAll, afterEach, beforeEach, describe, expect, setSystemTime, test } from 'bun:test';
import { createNotificationsService, NotFoundError } from '@tgab/core';
import type { User } from '@tgab/db';
import { NOTIFICATION_RESEND_WINDOW_MS } from '#core/constants/notifications.ts';
import { MS_PER_SECOND } from '#core/constants/time.ts';
import {
	createTestNotification,
	createTestUser,
	TEST_COUNTER_INPUT,
} from '../../helpers/factories.ts';
import { TestDatabase } from '../../helpers/test-database.ts';

const testDatabase = TestDatabase.fromEnv();
const db = testDatabase.createClient();
const notifications = createNotificationsService(db);
let owner: User;
let stranger: User;

const NOW = new Date('2026-01-15T10:00:30.000Z');

beforeEach(async () => {
	setSystemTime(NOW);
	await testDatabase.reset(db);
	owner = await createTestUser(db);
	stranger = await createTestUser(db);
});

afterEach(() => {
	setSystemTime();
});

afterAll(() => db.$disconnect());

describe('list', () => {
	test('Тест выдачи только уведомлений владельца, новые сверху', async () => {
		const first = await createTestNotification(db, owner.id);
		setSystemTime(new Date(NOW.getTime() + MS_PER_SECOND));
		const second = await createTestNotification(db, owner.id);
		await createTestNotification(db, stranger.id);

		const list = await notifications.list(owner.id);
		expect(list.map((notification) => notification.id)).toEqual([second.id, first.id]);
	});
});

describe('get', () => {
	test('Тест выброса NotFoundError для чужого уведомления вместо доступа к нему', async () => {
		const notification = await createTestNotification(db, owner.id);
		await expect(notifications.get(stranger.id, notification.id)).rejects.toThrow(NotFoundError);
	});

	test('Тест выброса NotFoundError для id не в формате UUID', async () => {
		await expect(notifications.get(owner.id, 'not-a-uuid')).rejects.toThrow(NotFoundError);
	});
});

describe('markRead', () => {
	test('Тест отметки прочитанным без изменения времени при повторе', async () => {
		const notification = await createTestNotification(db, owner.id);
		expect(notification.readAt).toBeNull();

		const read = await notifications.markRead(owner.id, notification.id);
		expect(read.readAt).toBe(NOW.toISOString());
		setSystemTime(new Date(NOW.getTime() + MS_PER_SECOND));
		expect((await notifications.markRead(owner.id, notification.id)).readAt).toBe(read.readAt);
	});

	test('Тест выброса NotFoundError для чужого уведомления без его изменения', async () => {
		const notification = await createTestNotification(db, owner.id);
		await expect(notifications.markRead(stranger.id, notification.id)).rejects.toThrow(
			NotFoundError,
		);
		expect((await notifications.get(owner.id, notification.id)).readAt).toBeNull();
	});
});

describe('remove', () => {
	test('Тест удаления уведомления без удаления счётчика', async () => {
		const notification = await createTestNotification(db, owner.id);
		await notifications.remove(owner.id, notification.id);
		await expect(notifications.get(owner.id, notification.id)).rejects.toThrow(NotFoundError);
		expect(await db.counter.count({ where: { id: notification.counter.id } })).toBe(1);
	});

	test('Тест выброса NotFoundError для чужого уведомления без его удаления', async () => {
		const notification = await createTestNotification(db, owner.id);
		await expect(notifications.remove(stranger.id, notification.id)).rejects.toThrow(NotFoundError);
		expect(await notifications.get(owner.id, notification.id)).toEqual(notification);
	});
});

describe('listUnsent', () => {
	test('Тест выдачи неотправленных всех пользователей, старые сначала', async () => {
		const first = await createTestNotification(db, owner.id);
		setSystemTime(new Date(NOW.getTime() + MS_PER_SECOND));
		const second = await createTestNotification(db, stranger.id);
		expect(await notifications.listUnsent(new Date())).toEqual([first.id, second.id]);
	});

	test('Тест выдачи без отправленных и недоставляемых', async () => {
		const sent = await createTestNotification(db, owner.id);
		const undeliverable = await createTestNotification(db, stranger.id);
		await notifications.markSent(sent.id);
		await notifications.markUndeliverable(undeliverable.id);
		expect(await notifications.listUnsent(NOW)).toEqual([]);
	});

	test('Тест выдачи без уведомлений старше окна досылки', async () => {
		const notification = await createTestNotification(db, owner.id);
		const edge = new Date(NOW.getTime() + NOTIFICATION_RESEND_WINDOW_MS);
		expect(await notifications.listUnsent(edge)).toEqual([notification.id]);
		expect(await notifications.listUnsent(new Date(edge.getTime() + 1))).toEqual([]);
	});
});

describe('markSent и markUndeliverable', () => {
	test('Тест запрета отметить недоставляемым уже отправленное', async () => {
		const notification = await createTestNotification(db, owner.id);
		await notifications.markSent(notification.id);
		await notifications.markUndeliverable(notification.id);
		const row = await db.counterNotification.findUniqueOrThrow({ where: { id: notification.id } });
		expect(row.deliveryFailedAt).toBeNull();
	});

	test('Тест сохранения времени отправки при повторной отметке', async () => {
		const notification = await createTestNotification(db, owner.id);
		await notifications.markSent(notification.id);
		setSystemTime(new Date(NOW.getTime() + MS_PER_SECOND));
		await notifications.markSent(notification.id);
		const row = await db.counterNotification.findUniqueOrThrow({ where: { id: notification.id } });
		expect(row.sentAt).toEqual(NOW);
	});

	test('Тест сохранения уведомления в Mini App после отметки', async () => {
		const notification = await createTestNotification(db, owner.id);
		await notifications.markUndeliverable(notification.id);
		expect(await notifications.get(owner.id, notification.id)).toEqual(notification);
	});
});

describe('getDelivery', () => {
	test('Тест данных сообщения для неотправленного уведомления', async () => {
		const notification = await createTestNotification(db, owner.id);
		expect(await notifications.getDelivery(notification.id)).toEqual({
			notificationId: notification.id,
			telegramId: owner.telegramId,
			counterTitle: TEST_COUNTER_INPUT.title,
			cycle: notification.cycle,
			showValue: TEST_COUNTER_INPUT.showValue,
			autoRestart: false,
		});
	});

	test('Тест показа числа у ручного счётчика, даже если оно скрыто', async () => {
		const notification = await createTestNotification(db, owner.id);
		await db.counter.update({
			where: { id: notification.counter.id },
			data: { showValue: false, manual: true },
		});
		expect((await notifications.getDelivery(notification.id))?.showValue).toBe(true);
	});

	test('Тест возврата null для отправленного, недоставляемого и удалённого уведомления', async () => {
		const sent = await createTestNotification(db, owner.id);
		const undeliverable = await createTestNotification(db, owner.id);
		const removed = await createTestNotification(db, owner.id);
		await notifications.markSent(sent.id);
		await notifications.markUndeliverable(undeliverable.id);
		await notifications.remove(owner.id, removed.id);
		for (const { id } of [sent, undeliverable, removed]) {
			expect(await notifications.getDelivery(id)).toBeNull();
		}
	});
});

describe('неверный id', () => {
	test('Тест выброса NotFoundError в markRead и remove для id не в формате UUID и неизвестного UUID', async () => {
		for (const id of ['not-a-uuid', crypto.randomUUID()]) {
			await expect(notifications.markRead(owner.id, id)).rejects.toThrow(NotFoundError);
			await expect(notifications.remove(owner.id, id)).rejects.toThrow(NotFoundError);
		}
	});

	test('Тест выброса NotFoundError в методах воркера для id не в формате UUID', async () => {
		await expect(notifications.markSent('not-a-uuid')).rejects.toThrow(NotFoundError);
		await expect(notifications.markUndeliverable('not-a-uuid')).rejects.toThrow(NotFoundError);
		await expect(notifications.getDelivery('not-a-uuid')).rejects.toThrow(NotFoundError);
	});

	test('Тест методов воркера для неизвестного UUID без ошибки и без записей', async () => {
		const id = crypto.randomUUID();
		await notifications.markSent(id);
		await notifications.markUndeliverable(id);
		expect(await notifications.getDelivery(id)).toBeNull();
		expect(await db.counterNotification.count()).toBe(0);
	});
});
