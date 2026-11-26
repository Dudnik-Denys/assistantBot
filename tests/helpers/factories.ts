import {
	type CounterDto,
	type CounterInput,
	createCountersService,
	createNotesService,
	createNotificationsService,
	createUsersService,
	type NoteDto,
	type NoteInput,
	type NotificationDto,
} from '@tgab/core';
import { COUNTER_TIMER_MODE } from '@tgab/core/constants/counters';
import type { PrismaClient, User } from '@tgab/db';

/** Фабрики тестовых записей: создают данные через сервисы core — тем же путём, что и приложение. */

let nextTelegramId = 1_000_000n;

/**
 * Пользователь из allowlist: telegramId — уникальный или заданный (e2e входят от имени
 * `E2E_TELEGRAM_ID` — `DEV_TELEGRAM_ID` web-сервера тестов).
 */
export function createTestUser(
	db: PrismaClient,
	{ isAdmin = false, telegramId }: { isAdmin?: boolean; telegramId?: bigint } = {},
): Promise<User> {
	nextTelegramId += 1n;
	return createUsersService(db).allow(telegramId ?? nextTelegramId, { isAdmin });
}

export function createTestNote(
	db: PrismaClient,
	userId: string,
	input: NoteInput = { title: 'Заметка' },
): Promise<NoteDto> {
	return createNotesService(db).create(userId, input);
}

/** Ручной счётчик без таймера — ввод, от которого тесты отталкиваются (`{ ...TEST_COUNTER_INPUT, … }`). */
export const TEST_COUNTER_INPUT = {
	title: 'Счётчик',
	manual: true,
	showValue: true,
	timer: null,
	repeatSame: false,
	autoRestart: false,
	notify: false,
	startStopHidden: false,
} as const satisfies CounterInput;

/** Таймер на час, со стартом в момент сохранения. */
export const TEST_HOUR_TIMER = {
	mode: COUNTER_TIMER_MODE.Duration,
	customStart: false,
	duration: { hours: 1 },
} as const satisfies CounterInput['timer'];

export function createTestCounter(
	db: PrismaClient,
	userId: string,
	input: Partial<CounterInput> = {},
): Promise<CounterDto> {
	return createCountersService(db).create(userId, { ...TEST_COUNTER_INPUT, ...input });
}

/**
 * Уведомление об окончании цикла: счётчик с таймером на час и уведомлениями, цикл которого
 * завершает `processDue` в момент окончания, — тот же путь, что у воркера. `processDue`
 * обрабатывает наступившие циклы всех пользователей: другие счётчики теста с таймером, который
 * кончается раньше часа, завершатся тоже.
 */
export async function createTestNotification(
	db: PrismaClient,
	userId: string,
): Promise<NotificationDto> {
	const counter = await createTestCounter(db, userId, { timer: TEST_HOUR_TIMER, notify: true });
	if (!counter.timer) throw new Error('У тестового счётчика нет таймера');
	await createCountersService(db).processDue(new Date(counter.timer.targetAt));
	const notification = (await createNotificationsService(db).list(userId)).find(
		(item) => item.counter.id === counter.id,
	);
	if (!notification) throw new Error('Уведомление не создано');
	return notification;
}
