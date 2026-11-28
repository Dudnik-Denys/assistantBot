import { describe, expect, test } from 'bun:test';
import {
	COUNTERS_DUE_INTERVAL_MS,
	COUNTERS_DUE_JOB_OPTIONS,
	COUNTERS_DUE_SCHEDULER_ID,
	JobName,
} from '#worker/constants/queues.ts';
import type { Queues } from '#worker/queues/index.ts';
import { scheduleRepeatingJobs } from '#worker/schedulers.ts';

// Периодические задачи воркера `schedulers.ts`: очередь — подмена, запоминающая вызовы.

describe('scheduleRepeatingJobs', () => {
	test('Тест регистрации выборки наступивших циклов раз в минуту', async () => {
		const calls: unknown[][] = [];
		const queue = {
			upsertJobScheduler: async (...args: unknown[]) => {
				calls.push(args);
			},
		};
		// Подмена содержит только то, что вызывает функция: настоящая очередь ходила бы в Redis.
		await scheduleRepeatingJobs({ countersDue: queue } as unknown as Queues);
		expect(calls).toEqual([
			[
				COUNTERS_DUE_SCHEDULER_ID,
				{ every: COUNTERS_DUE_INTERVAL_MS },
				{ name: JobName.ProcessDueCounters, opts: COUNTERS_DUE_JOB_OPTIONS },
			],
		]);
	});
});
