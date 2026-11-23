import type { Counter, PrismaClient } from '@tgab/db';
import { startOfMinute } from 'date-fns';
import { assertId } from '../common/id.ts';
import {
	COUNTER_DUE_BATCH_SIZE,
	COUNTER_DURATION_PARTS,
	COUNTER_EMPTY_DURATION,
	COUNTER_INITIAL_VALUE,
	COUNTER_NOT_FINISHED_MESSAGE,
	COUNTER_RESTART_NEEDS_PARAMS_MESSAGE,
	COUNTER_TARGET_PASSED_MESSAGE,
	COUNTER_TIMER_MODE,
	COUNTER_TIMER_STATUS,
	COUNTER_TRANSACTION_TIMEOUT_MS,
	COUNTER_VALUE_MIN,
} from '../constants/counters.ts';
import { LIST_LIMIT_MAX } from '../constants/list.ts';
import { NotFoundError, ValidationError } from '../errors.ts';
import {
	type CounterDuration,
	CounterInputSchema,
	type CounterTimerInput,
} from '../schemas/counters/counter-input.ts';
import { addDuration, finishCycle, localToUtc, nextCycle } from './timer.ts';
import type { CounterDto } from './types.ts';

const NOT_FOUND = 'Счётчик не найден';

function durationOf(row: Counter): CounterDuration {
	return {
		months: row.durationMonths,
		weeks: row.durationWeeks,
		days: row.durationDays,
		hours: row.durationHours,
		minutes: row.durationMinutes,
	};
}

function durationColumns(duration: CounterDuration) {
	return {
		durationMonths: duration.months,
		durationWeeks: duration.weeks,
		durationDays: duration.days,
		durationHours: duration.hours,
		durationMinutes: duration.minutes,
	};
}

export function toCounterDto(row: Counter): CounterDto {
	const { timerMode, startAt, targetAt, timerStatus } = row;
	return {
		id: row.id,
		title: row.title,
		value: row.value,
		manual: row.manual,
		showValue: row.showValue,
		timer:
			timerMode && startAt && targetAt && timerStatus
				? {
						mode: timerMode,
						duration: durationOf(row),
						startAt: startAt.toISOString(),
						targetAt: targetAt.toISOString(),
						status: timerStatus,
					}
				: null,
		finishedAt: row.finishedAt?.toISOString() ?? null,
		repeatSame: row.repeatSame,
		autoRestart: row.autoRestart,
		notify: row.notify,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
	};
}

/**
 * Колонки таймера по вводу: новый цикл запускается сейчас. Время ввода — локальное время
 * пользователя; окончание, которое уже прошло, — `ValidationError`.
 */
function timerColumns(timer: CounterTimerInput | null, timeZone: string, now: Date) {
	if (!timer) {
		return {
			timerMode: null,
			...durationColumns(COUNTER_EMPTY_DURATION),
			startAt: null,
			targetAt: null,
			timerStatus: null,
		};
	}
	const duration =
		timer.mode === COUNTER_TIMER_MODE.Duration ? timer.duration : COUNTER_EMPTY_DURATION;
	const startAt =
		timer.mode === COUNTER_TIMER_MODE.Duration
			? localToUtc(timer.startAt, timeZone)
			: startOfMinute(now);
	const targetAt =
		timer.mode === COUNTER_TIMER_MODE.Duration
			? addDuration(startAt, duration, timeZone)
			: localToUtc(timer.targetAt, timeZone);
	if (targetAt <= now) throw new ValidationError(COUNTER_TARGET_PASSED_MESSAGE);
	return {
		timerMode: timer.mode,
		...durationColumns(duration),
		startAt,
		targetAt,
		timerStatus: COUNTER_TIMER_STATUS.Running,
	};
}

/** Изменились ли параметры таймера: если нет, текущий цикл (и его статус) не трогаем. */
function timerChanged(row: Counter, timer: CounterTimerInput | null, timeZone: string): boolean {
	if (!timer) return row.timerMode !== null;
	if (row.timerMode !== timer.mode) return true;
	if (timer.mode === COUNTER_TIMER_MODE.Date) {
		return localToUtc(timer.targetAt, timeZone).getTime() !== row.targetAt?.getTime();
	}
	const stored = durationOf(row);
	const sameDuration = COUNTER_DURATION_PARTS.every(
		(part) => stored[part] === timer.duration[part],
	);
	return !sameDuration || localToUtc(timer.startAt, timeZone).getTime() !== row.startAt?.getTime();
}

/**
 * Счётчики: число (ручное управление, +1 за каждый цикл) и таймер на срок или до даты.
 * Все методы пользовательских данных принимают userId явно и работают только с его счётчиками;
 * ввод снаружи — `unknown`, его проверяет схема здесь. Время цикла складывается в часовом
 * поясе пользователя (`counters/timer.ts`), хранится в UTC.
 */
export function createCountersService(db: PrismaClient) {
	async function timeZoneOf(userId: string): Promise<string> {
		const user = await db.user.findUniqueOrThrow({
			where: { id: userId },
			select: { timezone: true },
		});
		return user.timezone;
	}

	async function findOwn(userId: string, id: string): Promise<Counter> {
		assertId(id, NOT_FOUND);
		const row = await db.counter.findFirst({ where: { id, userId } });
		if (!row) throw new NotFoundError(NOT_FOUND);
		return row;
	}

	/**
	 * Окончание цикла одного счётчика в транзакции: строка блокируется `FOR UPDATE SKIP LOCKED`
	 * (её уже обрабатывает другой воркер — пропускаем), число +1, следующий цикл (автоповтор)
	 * или статус FINISHED, уведомление — если включено.
	 */
	function finishDue(id: string, now: Date): Promise<void> {
		return db.$transaction(
			async (tx) => {
				const locked = await tx.$queryRaw<{ id: string }[]>`
					SELECT id
					FROM "Counter"
					WHERE id = ${id}::uuid
					AND "timerStatus" = ${COUNTER_TIMER_STATUS.Running}::"CounterTimerStatus"
					AND "targetAt" <= ${now}
					FOR UPDATE SKIP LOCKED
				`;
				if (locked.length === 0) return;
				const row = await tx.counter.findUniqueOrThrow({
					where: { id },
					include: { user: { select: { timezone: true } } },
				});
				const { timerMode, startAt, targetAt } = row;
				if (!timerMode || !startAt || !targetAt) return;
				const finished = finishCycle(
					{
						timerMode,
						startAt,
						targetAt,
						duration: durationOf(row),
						value: row.value,
						autoRestart: row.autoRestart,
					},
					now,
					row.user.timezone,
				);
				await tx.counter.update({
					where: { id },
					data: {
						value: finished.value,
						startAt: finished.startAt,
						targetAt: finished.targetAt,
						timerStatus: finished.status,
						finishedAt: finished.finishedAt,
					},
				});
				if (!row.notify) return;
				await tx.counterNotification.create({
					data: {
						userId: row.userId,
						counterId: id,
						cycle: finished.value,
						finishedAt: finished.finishedAt,
					},
				});
			},
			{ timeout: COUNTER_TRANSACTION_TIMEOUT_MS },
		);
	}

	return {
		/** Все счётчики, новые сверху (порядок не меняется от +1 и правок). */
		async list(userId: string): Promise<CounterDto[]> {
			const rows = await db.counter.findMany({
				where: { userId },
				orderBy: { createdAt: 'desc' },
				take: LIST_LIMIT_MAX,
			});
			return rows.map(toCounterDto);
		},

		async get(userId: string, id: string): Promise<CounterDto> {
			return toCounterDto(await findOwn(userId, id));
		},

		async create(userId: string, input: unknown): Promise<CounterDto> {
			const { timer, ...fields } = CounterInputSchema.parse(input);
			const timeZone = await timeZoneOf(userId);
			const row = await db.counter.create({
				data: {
					...fields,
					userId,
					value: COUNTER_INITIAL_VALUE,
					...timerColumns(timer, timeZone, new Date()),
				},
			});
			return toCounterDto(row);
		},

		/**
		 * Изменение. Новые параметры таймера запускают новый цикл; если они те же
		 * (поменялись только название или флаги), текущий цикл продолжается как был.
		 */
		async update(userId: string, id: string, input: unknown): Promise<CounterDto> {
			const { timer, ...fields } = CounterInputSchema.parse(input);
			const row = await findOwn(userId, id);
			const timeZone = await timeZoneOf(userId);
			const { count } = await db.counter.updateMany({
				where: { id, userId },
				data: {
					...fields,
					...(timerChanged(row, timer, timeZone) ? timerColumns(timer, timeZone, new Date()) : {}),
				},
			});
			if (count === 0) throw new NotFoundError(NOT_FOUND);
			return this.get(userId, id);
		},

		async increment(userId: string, id: string): Promise<CounterDto> {
			assertId(id, NOT_FOUND);
			await db.counter.updateMany({ where: { id, userId }, data: { value: { increment: 1 } } });
			return this.get(userId, id);
		},

		/** −1, но не ниже `COUNTER_VALUE_MIN`. */
		async decrement(userId: string, id: string): Promise<CounterDto> {
			assertId(id, NOT_FOUND);
			await db.counter.updateMany({
				where: { id, userId, value: { gt: COUNTER_VALUE_MIN } },
				data: { value: { decrement: 1 } },
			});
			return this.get(userId, id);
		},

		async reset(userId: string, id: string): Promise<CounterDto> {
			assertId(id, NOT_FOUND);
			await db.counter.updateMany({
				where: { id, userId },
				data: { value: COUNTER_INITIAL_VALUE },
			});
			return this.get(userId, id);
		},

		/**
		 * «Продолжить» закончившийся цикл с теми же параметрами — от текущего момента.
		 * Без `repeatSame` новый срок или дату задают в настройках (`update`).
		 */
		async restart(userId: string, id: string): Promise<CounterDto> {
			const row = await findOwn(userId, id);
			const { timerMode, startAt, targetAt } = row;
			if (
				!timerMode ||
				!startAt ||
				!targetAt ||
				row.timerStatus !== COUNTER_TIMER_STATUS.Finished
			) {
				throw new ValidationError(COUNTER_NOT_FINISHED_MESSAGE);
			}
			if (!row.repeatSame) throw new ValidationError(COUNTER_RESTART_NEEDS_PARAMS_MESSAGE);
			// С начала минуты: время в форме — с точностью до минуты, и сохранение формы
			// без изменений не должно считаться новыми параметрами таймера.
			const cycle = nextCycle(
				{ timerMode, startAt, targetAt, duration: durationOf(row) },
				startOfMinute(new Date()),
				await timeZoneOf(userId),
			);
			// Условие на статус — в самом запросе: из двух одновременных «Продолжить» сработает одно.
			const { count } = await db.counter.updateMany({
				where: { id, userId, timerStatus: COUNTER_TIMER_STATUS.Finished },
				data: { ...cycle, timerStatus: COUNTER_TIMER_STATUS.Running },
			});
			if (count === 0) throw new ValidationError(COUNTER_NOT_FINISHED_MESSAGE);
			return this.get(userId, id);
		},

		async remove(userId: string, id: string): Promise<void> {
			assertId(id, NOT_FOUND);
			const { count } = await db.counter.deleteMany({ where: { id, userId } });
			if (count === 0) throw new NotFoundError(NOT_FOUND);
		},

		/**
		 * Для воркера (все пользователи): окончание циклов, наступивших к `now`. Берёт пачку
		 * до `COUNTER_DUE_BATCH_SIZE`; каждый счётчик — в своей короткой транзакции
		 * (`finishDue`), так что сбой одного не откатывает остальные. Уведомления создаются
		 * в той же транзакции, а в Telegram их отправляет воркер отдельно (outbox,
		 * `notifications.listUnsent`). Возвращает размер пачки: полная — могут быть ещё.
		 */
		async processDue(now: Date): Promise<number> {
			const due = await db.counter.findMany({
				where: { timerStatus: COUNTER_TIMER_STATUS.Running, targetAt: { lte: now } },
				orderBy: { targetAt: 'asc' },
				take: COUNTER_DUE_BATCH_SIZE,
				select: { id: true },
			});
			for (const { id } of due) await finishDue(id, now);
			return due.length;
		},
	};
}

export type CountersService = ReturnType<typeof createCountersService>;
