import { afterAll, afterEach, beforeEach, describe, expect, setSystemTime, test } from 'bun:test';
import {
	createCountersService,
	createNotificationsService,
	NotFoundError,
	ValidationError,
} from '@tgab/core';
import type { User } from '@tgab/db';
import {
	COUNTER_ALREADY_RUNNING_MESSAGE,
	COUNTER_INITIAL_VALUE,
	COUNTER_NO_TIMER_MESSAGE,
	COUNTER_NOT_RUNNING_MESSAGE,
	COUNTER_RESTART_NEEDS_PARAMS_MESSAGE,
	COUNTER_TARGET_PASSED_MESSAGE,
	COUNTER_TIMER_MODE,
	COUNTER_TIMER_STATUS,
} from '#core/constants/counters.ts';
import {
	MS_PER_DAY,
	MS_PER_SECOND,
	SECONDS_PER_HOUR,
	SECONDS_PER_MINUTE,
} from '#core/constants/time.ts';
import {
	createTestCounter,
	createTestNotification,
	createTestUser,
	TEST_COUNTER_INPUT,
	TEST_HOUR_TIMER,
} from '../../helpers/factories.ts';
import { TestDatabase } from '../../helpers/test-database.ts';

const testDatabase = TestDatabase.fromEnv();
const db = testDatabase.createClient();
const counters = createCountersService(db);
const notifications = createNotificationsService(db);
let owner: User;
let stranger: User;

// Время тестов: 12:00:30 по Киеву (часовой пояс новых пользователей), зимой — UTC+2.
const NOW = new Date('2026-01-15T10:00:30.000Z');
const NOW_MINUTE = new Date('2026-01-15T10:00:00.000Z');
const MS_PER_MINUTE = SECONDS_PER_MINUTE * MS_PER_SECOND;
const MS_PER_HOUR = SECONDS_PER_HOUR * MS_PER_SECOND;
const PAUSE_MS = 10 * MS_PER_MINUTE;
const DATE_TIMER = { mode: COUNTER_TIMER_MODE.Date, targetAt: '2026-01-20T12:00' } as const;
const DATE_TIMER_TARGET = '2026-01-20T10:00:00.000Z';

/** Сдвинуть «сейчас» на `ms` от `NOW`. */
function advance(ms: number): Date {
	const now = new Date(NOW.getTime() + ms);
	setSystemTime(now);
	return now;
}

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

describe('create', () => {
	test('Ручной счётчик без таймера с начальным числом', async () => {
		const counter = await createTestCounter(db, owner.id);
		expect(counter).toMatchObject({
			title: TEST_COUNTER_INPUT.title,
			value: COUNTER_INITIAL_VALUE,
			manual: true,
			timer: null,
			finishedAt: null,
		});
	});

	test('Таймер на срок со стартом от начала текущей минуты', async () => {
		const counter = await createTestCounter(db, owner.id, { timer: TEST_HOUR_TIMER });
		expect(counter.timer).toMatchObject({
			mode: COUNTER_TIMER_MODE.Duration,
			status: COUNTER_TIMER_STATUS.Running,
			startAt: NOW_MINUTE.toISOString(),
			targetAt: new Date(NOW_MINUTE.getTime() + MS_PER_HOUR).toISOString(),
			pausedAt: null,
			customStart: false,
		});
	});

	test('Свой старт — по времени пользователя', async () => {
		const timer = { ...TEST_HOUR_TIMER, customStart: true, startAt: '2026-01-15T11:30' };
		const counter = await createTestCounter(db, owner.id, { timer });
		expect(counter.timer).toMatchObject({
			startAt: '2026-01-15T09:30:00.000Z',
			targetAt: '2026-01-15T10:30:00.000Z',
			customStart: true,
		});
	});

	test('Таймер до даты — по времени пользователя', async () => {
		const counter = await createTestCounter(db, owner.id, { timer: DATE_TIMER });
		expect(counter.timer).toMatchObject({
			mode: COUNTER_TIMER_MODE.Date,
			startAt: NOW_MINUTE.toISOString(),
			targetAt: DATE_TIMER_TARGET,
		});
	});

	test('Отклонение окончания, которое уже прошло', async () => {
		const timer = { ...DATE_TIMER, targetAt: '2026-01-15T11:59' };
		await expect(createTestCounter(db, owner.id, { timer })).rejects.toThrow(
			COUNTER_TARGET_PASSED_MESSAGE,
		);
	});

	test('Отклонение ввода не той формы', async () => {
		await expect(counters.create(owner.id, { title: 42 })).rejects.toThrow(ValidationError);
	});
});

describe('get', () => {
	test('Выброс NotFoundError для чужого счётчика вместо доступа к нему', async () => {
		const counter = await createTestCounter(db, owner.id);
		await expect(counters.get(stranger.id, counter.id)).rejects.toThrow(NotFoundError);
	});

	test('Выброс NotFoundError для id не в формате UUID', async () => {
		await expect(counters.get(owner.id, 'not-a-uuid')).rejects.toThrow(NotFoundError);
	});
});

describe('list', () => {
	test('Выдача только счётчиков владельца, новые сверху', async () => {
		const first = await createTestCounter(db, owner.id);
		advance(MS_PER_SECOND);
		const second = await createTestCounter(db, owner.id);
		await createTestCounter(db, stranger.id);

		const list = await counters.list(owner.id);
		expect(list.map((counter) => counter.id)).toEqual([second.id, first.id]);
	});
});

describe('update', () => {
	test('Без изменения таймера текущий цикл и пауза сохраняются', async () => {
		const counter = await createTestCounter(db, owner.id, { timer: TEST_HOUR_TIMER });
		const paused = await counters.pause(owner.id, counter.id);
		advance(PAUSE_MS);

		const updated = await counters.update(owner.id, counter.id, {
			...TEST_COUNTER_INPUT,
			title: 'Новое название',
			timer: TEST_HOUR_TIMER,
		});
		expect(updated.title).toBe('Новое название');
		expect(updated.timer).toEqual(paused.timer);
	});

	test('Новый срок запускает новый цикл с текущей минуты', async () => {
		const counter = await createTestCounter(db, owner.id, { timer: TEST_HOUR_TIMER });
		await counters.pause(owner.id, counter.id);
		const now = advance(PAUSE_MS);

		const updated = await counters.update(owner.id, counter.id, {
			...TEST_COUNTER_INPUT,
			timer: { ...TEST_HOUR_TIMER, duration: { hours: 2 } },
		});
		expect(updated.timer).toMatchObject({
			status: COUNTER_TIMER_STATUS.Running,
			startAt: new Date(now.getTime() - (now.getTime() % MS_PER_MINUTE)).toISOString(),
			pausedAt: null,
		});
	});

	test('Тот же свой старт после паузы с секундами не считается новым', async () => {
		const timer = { ...TEST_HOUR_TIMER, customStart: true, startAt: '2026-01-15T11:30' };
		const counter = await createTestCounter(db, owner.id, { timer });
		await counters.pause(owner.id, counter.id);
		advance(90 * MS_PER_SECOND);
		// Цикл сдвинут на паузу: старт — 11:31:30, форма показывает его как 11:31.
		const started = await counters.start(owner.id, counter.id);

		const updated = await counters.update(owner.id, counter.id, {
			...TEST_COUNTER_INPUT,
			timer: { ...timer, startAt: '2026-01-15T11:31' },
		});
		expect(updated.timer).toEqual(started.timer);
	});

	test('Удаление таймера', async () => {
		const counter = await createTestCounter(db, owner.id, { timer: TEST_HOUR_TIMER });
		const updated = await counters.update(owner.id, counter.id, TEST_COUNTER_INPUT);
		expect(updated.timer).toBeNull();
	});

	test('Выброс NotFoundError для чужого счётчика без его изменения', async () => {
		const counter = await createTestCounter(db, owner.id);
		await expect(
			counters.update(stranger.id, counter.id, { ...TEST_COUNTER_INPUT, title: 'Чужое' }),
		).rejects.toThrow(NotFoundError);
		expect((await counters.get(owner.id, counter.id)).title).toBe(counter.title);
	});

	test('Отклонение некорректного ввода', async () => {
		const counter = await createTestCounter(db, owner.id);
		await expect(
			counters.update(owner.id, counter.id, { ...TEST_COUNTER_INPUT, title: '' }),
		).rejects.toThrow(ValidationError);
	});
});

describe('increment и decrement', () => {
	test('Изменение числа на 1', async () => {
		const counter = await createTestCounter(db, owner.id);
		await counters.increment(owner.id, counter.id);
		expect((await counters.increment(owner.id, counter.id)).value).toBe(2);
		expect((await counters.decrement(owner.id, counter.id)).value).toBe(1);
	});

	test('Число не опускается ниже нуля', async () => {
		const counter = await createTestCounter(db, owner.id);
		expect((await counters.decrement(owner.id, counter.id)).value).toBe(COUNTER_INITIAL_VALUE);
	});

	test('Выброс NotFoundError для чужого счётчика без его изменения', async () => {
		const counter = await createTestCounter(db, owner.id);
		await expect(counters.increment(stranger.id, counter.id)).rejects.toThrow(NotFoundError);
		await expect(counters.decrement(stranger.id, counter.id)).rejects.toThrow(NotFoundError);
		expect((await counters.get(owner.id, counter.id)).value).toBe(COUNTER_INITIAL_VALUE);
	});
});

describe('reset', () => {
	test('Начальное число и новый цикл на срок на паузе с текущего момента', async () => {
		const counter = await createTestCounter(db, owner.id, { timer: TEST_HOUR_TIMER });
		await counters.increment(owner.id, counter.id);
		const now = advance(PAUSE_MS);

		const reset = await counters.reset(owner.id, counter.id);
		expect(reset.value).toBe(COUNTER_INITIAL_VALUE);
		expect(reset.timer).toMatchObject({
			status: COUNTER_TIMER_STATUS.Paused,
			startAt: now.toISOString(),
			targetAt: new Date(now.getTime() + MS_PER_HOUR).toISOString(),
			pausedAt: now.toISOString(),
		});
	});

	test('Таймер до даты остаётся до той же даты', async () => {
		const counter = await createTestCounter(db, owner.id, { timer: DATE_TIMER });
		const reset = await counters.reset(owner.id, counter.id);
		expect(reset.timer).toMatchObject({
			status: COUNTER_TIMER_STATUS.Paused,
			targetAt: DATE_TIMER_TARGET,
		});
	});

	test('Выброс NotFoundError для чужого счётчика', async () => {
		const counter = await createTestCounter(db, owner.id);
		await expect(counters.reset(stranger.id, counter.id)).rejects.toThrow(NotFoundError);
	});
});

describe('pause', () => {
	test('Идущий таймер — на паузу с текущего момента', async () => {
		const counter = await createTestCounter(db, owner.id, { timer: TEST_HOUR_TIMER });
		const paused = await counters.pause(owner.id, counter.id);
		expect(paused.timer).toMatchObject({
			status: COUNTER_TIMER_STATUS.Paused,
			pausedAt: NOW.toISOString(),
		});
	});

	test('Отклонение паузы у таймера, который не идёт', async () => {
		const counter = await createTestCounter(db, owner.id, { timer: TEST_HOUR_TIMER });
		await counters.pause(owner.id, counter.id);
		await expect(counters.pause(owner.id, counter.id)).rejects.toThrow(COUNTER_NOT_RUNNING_MESSAGE);
	});

	test('Отклонение паузы у цикла, который уже закончился', async () => {
		const counter = await createTestCounter(db, owner.id, { timer: TEST_HOUR_TIMER });
		advance(2 * MS_PER_HOUR);
		await expect(counters.pause(owner.id, counter.id)).rejects.toThrow(COUNTER_NOT_RUNNING_MESSAGE);
	});

	test('Отклонение паузы у счётчика без таймера', async () => {
		const counter = await createTestCounter(db, owner.id);
		await expect(counters.pause(owner.id, counter.id)).rejects.toThrow(ValidationError);
	});

	test('Выброс NotFoundError для чужого счётчика', async () => {
		const counter = await createTestCounter(db, owner.id, { timer: TEST_HOUR_TIMER });
		await expect(counters.pause(stranger.id, counter.id)).rejects.toThrow(NotFoundError);
	});
});

describe('start', () => {
	test('Таймер на срок после паузы сдвигается на её длину', async () => {
		const counter = await createTestCounter(db, owner.id, { timer: TEST_HOUR_TIMER });
		await counters.pause(owner.id, counter.id);
		advance(PAUSE_MS);

		const started = await counters.start(owner.id, counter.id);
		expect(started.timer).toMatchObject({
			status: COUNTER_TIMER_STATUS.Running,
			startAt: new Date(NOW_MINUTE.getTime() + PAUSE_MS).toISOString(),
			targetAt: new Date(NOW_MINUTE.getTime() + MS_PER_HOUR + PAUSE_MS).toISOString(),
			pausedAt: null,
		});
	});

	test('Таймер до даты после паузы — без сдвига даты', async () => {
		const counter = await createTestCounter(db, owner.id, { timer: DATE_TIMER });
		await counters.pause(owner.id, counter.id);
		advance(PAUSE_MS);

		const started = await counters.start(owner.id, counter.id);
		expect(started.timer).toMatchObject({
			status: COUNTER_TIMER_STATUS.Running,
			targetAt: DATE_TIMER_TARGET,
			pausedAt: null,
		});
	});

	test('Закончившийся цикл с теми же параметрами — заново с текущей минуты', async () => {
		const counter = await createTestCounter(db, owner.id, {
			timer: TEST_HOUR_TIMER,
			repeatSame: true,
		});
		const now = advance(2 * MS_PER_HOUR);
		await counters.finish(owner.id, counter.id);

		const started = await counters.start(owner.id, counter.id);
		const minute = now.getTime() - (now.getTime() % MS_PER_MINUTE);
		expect(started.timer).toMatchObject({
			status: COUNTER_TIMER_STATUS.Running,
			startAt: new Date(minute).toISOString(),
			targetAt: new Date(minute + MS_PER_HOUR).toISOString(),
		});
	});

	test('Отклонение старта закончившегося цикла без тех же параметров', async () => {
		const counter = await createTestCounter(db, owner.id, { timer: TEST_HOUR_TIMER });
		advance(2 * MS_PER_HOUR);
		await counters.finish(owner.id, counter.id);
		await expect(counters.start(owner.id, counter.id)).rejects.toThrow(
			COUNTER_RESTART_NEEDS_PARAMS_MESSAGE,
		);
	});

	test('Отклонение старта идущего таймера', async () => {
		const counter = await createTestCounter(db, owner.id, { timer: TEST_HOUR_TIMER });
		await expect(counters.start(owner.id, counter.id)).rejects.toThrow(
			COUNTER_ALREADY_RUNNING_MESSAGE,
		);
	});

	test('Отклонение старта счётчика без таймера', async () => {
		const counter = await createTestCounter(db, owner.id);
		await expect(counters.start(owner.id, counter.id)).rejects.toThrow(COUNTER_NO_TIMER_MESSAGE);
	});

	test('Из двух одновременных «Старт» срабатывает один', async () => {
		const counter = await createTestCounter(db, owner.id, { timer: TEST_HOUR_TIMER });
		await counters.pause(owner.id, counter.id);
		advance(PAUSE_MS);

		const results = await Promise.allSettled([
			counters.start(owner.id, counter.id),
			counters.start(owner.id, counter.id),
		]);
		expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
		const current = await counters.get(owner.id, counter.id);
		expect(current.timer?.targetAt).toBe(
			new Date(NOW_MINUTE.getTime() + MS_PER_HOUR + PAUSE_MS).toISOString(),
		);
	});

	test('Выброс NotFoundError для чужого счётчика', async () => {
		const counter = await createTestCounter(db, owner.id, { timer: TEST_HOUR_TIMER });
		await expect(counters.start(stranger.id, counter.id)).rejects.toThrow(NotFoundError);
	});
});

describe('remove', () => {
	test('Удаление счётчика вместе с его уведомлениями', async () => {
		const notification = await createTestNotification(db, owner.id);
		await counters.remove(owner.id, notification.counter.id);
		await expect(counters.get(owner.id, notification.counter.id)).rejects.toThrow(NotFoundError);
		expect(await notifications.list(owner.id)).toEqual([]);
	});

	test('Выброс NotFoundError для чужого счётчика без его удаления', async () => {
		const counter = await createTestCounter(db, owner.id);
		await expect(counters.remove(stranger.id, counter.id)).rejects.toThrow(NotFoundError);
		expect(await counters.get(owner.id, counter.id)).toEqual(counter);
	});

	test('Выброс NotFoundError для id не в формате UUID', async () => {
		await expect(counters.remove(owner.id, 'not-a-uuid')).rejects.toThrow(NotFoundError);
	});
});

describe('finish', () => {
	test('Наступивший цикл без автоповтора — +1 и FINISHED', async () => {
		const counter = await createTestCounter(db, owner.id, { timer: TEST_HOUR_TIMER });
		advance(2 * MS_PER_HOUR);

		const finished = await counters.finish(owner.id, counter.id);
		expect(finished.value).toBe(COUNTER_INITIAL_VALUE + 1);
		expect(finished.timer?.status).toBe(COUNTER_TIMER_STATUS.Finished);
		expect(finished.finishedAt).toBe(counter.timer?.targetAt ?? null);
	});

	test('Цикл, который ещё не наступил, не меняется', async () => {
		const counter = await createTestCounter(db, owner.id, { timer: TEST_HOUR_TIMER });
		expect(await counters.finish(owner.id, counter.id)).toEqual(counter);
	});

	test('Повторный вызов не даёт второго +1', async () => {
		const counter = await createTestCounter(db, owner.id, { timer: TEST_HOUR_TIMER });
		advance(2 * MS_PER_HOUR);
		await counters.finish(owner.id, counter.id);
		expect((await counters.finish(owner.id, counter.id)).value).toBe(COUNTER_INITIAL_VALUE + 1);
	});

	test('Выброс NotFoundError для чужого счётчика без его изменения', async () => {
		const counter = await createTestCounter(db, owner.id, { timer: TEST_HOUR_TIMER });
		advance(2 * MS_PER_HOUR);
		await expect(counters.finish(stranger.id, counter.id)).rejects.toThrow(NotFoundError);
		expect((await counters.get(owner.id, counter.id)).value).toBe(COUNTER_INITIAL_VALUE);
	});
});

describe('finishDueOf', () => {
	test('Завершение и возврат только наступивших счётчиков пользователя', async () => {
		const due = await createTestCounter(db, owner.id, { timer: TEST_HOUR_TIMER });
		const strangers = await createTestCounter(db, stranger.id, { timer: TEST_HOUR_TIMER });
		advance(2 * MS_PER_HOUR);
		await createTestCounter(db, owner.id, { timer: TEST_HOUR_TIMER });

		const finished = await counters.finishDueOf(owner.id);
		expect(finished.map((counter) => counter.id)).toEqual([due.id]);
		expect(finished[0]?.value).toBe(COUNTER_INITIAL_VALUE + 1);
		expect((await counters.get(stranger.id, strangers.id)).value).toBe(COUNTER_INITIAL_VALUE);
	});
});

describe('processDue', () => {
	test('Завершение наступивших циклов всех пользователей и уведомление при notify', async () => {
		const silent = await createTestCounter(db, owner.id, { timer: TEST_HOUR_TIMER });
		const notifying = await createTestCounter(db, stranger.id, {
			timer: TEST_HOUR_TIMER,
			notify: true,
		});
		await createTestCounter(db, owner.id, { timer: DATE_TIMER });

		const result = await counters.processDue(advance(2 * MS_PER_HOUR));
		expect(result).toEqual({ selected: 2, finished: 2, failed: [] });
		expect((await counters.get(owner.id, silent.id)).value).toBe(COUNTER_INITIAL_VALUE + 1);
		expect(await notifications.list(owner.id)).toEqual([]);
		const [notification] = await notifications.list(stranger.id);
		expect(notification).toMatchObject({
			cycle: COUNTER_INITIAL_VALUE + 1,
			finishedAt: notifying.timer?.targetAt,
			counter: { id: notifying.id, finished: true },
		});
	});

	test('Автоповтор: новый цикл с момента окончания прошлого', async () => {
		const counter = await createTestCounter(db, owner.id, {
			timer: TEST_HOUR_TIMER,
			repeatSame: true,
			autoRestart: true,
		});
		await counters.processDue(advance(MS_PER_HOUR + MS_PER_MINUTE));

		const current = await counters.get(owner.id, counter.id);
		expect(current.value).toBe(COUNTER_INITIAL_VALUE + 1);
		expect(current.timer).toMatchObject({
			status: COUNTER_TIMER_STATUS.Running,
			startAt: counter.timer?.targetAt,
			targetAt: new Date(NOW_MINUTE.getTime() + 2 * MS_PER_HOUR).toISOString(),
		});
	});

	test('Повторный проход и Mini App не дают второго +1', async () => {
		const counter = await createTestCounter(db, owner.id, { timer: TEST_HOUR_TIMER });
		const now = advance(2 * MS_PER_HOUR);
		await counters.finish(owner.id, counter.id);

		expect(await counters.processDue(now)).toEqual({ selected: 0, finished: 0, failed: [] });
		expect((await counters.get(owner.id, counter.id)).value).toBe(COUNTER_INITIAL_VALUE + 1);
	});

	test('Одновременные проходы завершают цикл один раз', async () => {
		const counter = await createTestCounter(db, owner.id, {
			timer: TEST_HOUR_TIMER,
			notify: true,
		});
		const now = advance(2 * MS_PER_HOUR);

		const results = await Promise.all([counters.processDue(now), counters.processDue(now)]);
		expect(results.reduce((sum, result) => sum + result.finished, 0)).toBe(1);
		expect((await counters.get(owner.id, counter.id)).value).toBe(COUNTER_INITIAL_VALUE + 1);
		expect(await notifications.list(owner.id)).toHaveLength(1);
	});

	test('Ошибка одной записи не прерывает остальные и возвращается в failed', async () => {
		const broken = await createTestCounter(db, stranger.id, {
			timer: { ...TEST_HOUR_TIMER, duration: { days: 1 } },
			repeatSame: true,
			autoRestart: true,
		});
		const healthy = await createTestCounter(db, owner.id, { timer: TEST_HOUR_TIMER });
		// Испорченная запись: календарный срок складывается в несуществующем часовом поясе.
		// Сервиса для смены пояса нет — запись правится напрямую.
		await db.user.update({ where: { id: stranger.id }, data: { timezone: 'Invalid/Zone' } });

		const result = await counters.processDue(advance(2 * MS_PER_DAY));
		expect(result.selected).toBe(2);
		expect(result.finished).toBe(1);
		expect(result.failed.map((failure) => failure.id)).toEqual([broken.id]);
		expect((await counters.get(owner.id, healthy.id)).value).toBe(COUNTER_INITIAL_VALUE + 1);
		expect((await counters.get(stranger.id, broken.id)).value).toBe(COUNTER_INITIAL_VALUE);
	});
});
