import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test';
import type { CountersService, NotificationsService } from '@tgab/core';
import type { Queue } from 'bullmq';
import { COUNTER_DUE_BATCH_SIZE } from '#core/constants/counters.ts';
import type { ProcessDueResult } from '#core/counters/types.ts';
import {
	COUNTERS_DUE_MAX_PASSES,
	JobName,
	NOTIFICATION_JOB_ID_PREFIX,
	NOTIFICATION_JOB_OPTIONS,
} from '#worker/constants/queues.ts';
import { createCountersDueJob } from '#worker/jobs/counters-due.ts';
import type { NotificationJobData } from '#worker/schemas/jobs.ts';

// Задача воркера `jobs/counters-due.ts`: сервисы и очередь — подмены, их собственная логика
// проверена отдельно (integration/counters, integration/reminders).

const FULL_PASS: ProcessDueResult = { selected: COUNTER_DUE_BATCH_SIZE, finished: 1, failed: [] };
const LAST_PASS: ProcessDueResult = { selected: 1, finished: 1, failed: [] };
const NOTIFICATION_IDS = ['n1', 'n2'];

interface FakeJob {
	failed: boolean;
	removed: boolean;
}

/** Подмены сервисов и очереди: проходы `processDue` — по сценарию `passes`, задачи в Redis — `jobs`. */
function setup({
	passes = [LAST_PASS],
	unsent = [] as string[],
	jobs = new Map<string, FakeJob>(),
}: {
	passes?: ProcessDueResult[];
	unsent?: string[];
	jobs?: Map<string, FakeJob>;
} = {}) {
	const processDueCalls: Date[] = [];
	const added: { name: string; data: NotificationJobData; opts: { jobId: string } }[][] = [];
	const counters = {
		processDue: async (now: Date) => {
			processDueCalls.push(now);
			return passes[Math.min(processDueCalls.length - 1, passes.length - 1)];
		},
	};
	const notifications = { listUnsent: async () => unsent };
	const queue = {
		getJob: async (jobId: string) => {
			const job = jobs.get(jobId);
			return (
				job && {
					isFailed: async () => job.failed,
					remove: async () => {
						job.removed = true;
					},
				}
			);
		},
		addBulk: async (bulk: (typeof added)[number]) => {
			added.push(bulk);
		},
	};
	// Подмены содержат только то, что вызывает задача; настоящие сервисы ходили бы в БД, очередь — в Redis.
	const job = createCountersDueJob({
		counters: counters as unknown as CountersService,
		notifications: notifications as unknown as NotificationsService,
		notificationsQueue: queue as unknown as Queue<NotificationJobData>,
	});
	return { job, processDueCalls, added, jobs };
}

let errorSpy: ReturnType<typeof spyOn>;

beforeEach(() => {
	errorSpy = spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
	errorSpy.mockRestore();
});

describe('выборка наступивших', () => {
	test('Тест одного прохода при неполной пачке', async () => {
		const { job, processDueCalls } = setup();
		await job();
		expect(processDueCalls).toHaveLength(1);
	});

	test('Тест следующего прохода после полной пачки с тем же моментом', async () => {
		const { job, processDueCalls } = setup({ passes: [FULL_PASS, FULL_PASS, LAST_PASS] });
		await job();
		expect(processDueCalls).toHaveLength(3);
		expect(new Set(processDueCalls.map((now) => now.getTime())).size).toBe(1);
	});

	test('Тест остановки, если в полной пачке ничего не завершилось', async () => {
		const stuck = { ...FULL_PASS, finished: 0 };
		const { job, processDueCalls } = setup({ passes: [FULL_PASS, stuck, FULL_PASS] });
		await job();
		expect(processDueCalls).toHaveLength(2);
	});

	test(`Тест ограничения ${COUNTERS_DUE_MAX_PASSES} проходами за запуск`, async () => {
		const { job, processDueCalls } = setup({ passes: [FULL_PASS] });
		await job();
		expect(processDueCalls).toHaveLength(COUNTERS_DUE_MAX_PASSES);
	});

	test('Тест лога ошибок записей с id счётчика', async () => {
		const failure = { id: 'broken-counter', error: new Error('Сбой') };
		const { job } = setup({ passes: [{ selected: 1, finished: 0, failed: [failure] }] });
		await job();
		expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining(failure.id), failure.error);
	});
});

describe('outbox', () => {
	test('Тест пустой очереди, если неотправленных нет', async () => {
		const { job, added } = setup();
		await job();
		expect(added).toEqual([]);
	});

	test('Тест постановки неотправленных в очередь одной пачкой с jobId из id уведомления', async () => {
		const { job, added } = setup({ unsent: NOTIFICATION_IDS });
		await job();
		expect(added).toEqual([
			NOTIFICATION_IDS.map((notificationId) => ({
				name: JobName.SendCounterNotification,
				data: { notificationId },
				opts: {
					...NOTIFICATION_JOB_OPTIONS,
					jobId: `${NOTIFICATION_JOB_ID_PREFIX}-${notificationId}`,
				},
			})),
		]);
	});

	test('Тест удаления упавшей задачи перед постановкой без удаления ждущей', async () => {
		const jobs = new Map<string, FakeJob>([
			[`${NOTIFICATION_JOB_ID_PREFIX}-n1`, { failed: true, removed: false }],
			[`${NOTIFICATION_JOB_ID_PREFIX}-n2`, { failed: false, removed: false }],
		]);
		const { job } = setup({ unsent: NOTIFICATION_IDS, jobs });
		await job();
		expect(jobs.get(`${NOTIFICATION_JOB_ID_PREFIX}-n1`)?.removed).toBe(true);
		expect(jobs.get(`${NOTIFICATION_JOB_ID_PREFIX}-n2`)?.removed).toBe(false);
	});
});
