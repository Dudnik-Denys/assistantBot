import {
	COUNTERS_DUE_INTERVAL_MS,
	COUNTERS_DUE_JOB_OPTIONS,
	COUNTERS_DUE_SCHEDULER_ID,
	JobName,
} from '#worker/constants/queues.ts';
import type { Queues } from '#worker/queues/index.ts';

/**
 * Повторяющиеся задачи. `upsertJobScheduler` идемпотентен: перезапуск воркера
 * обновляет планировщик, а не заводит второй.
 */
export async function scheduleRepeatingJobs(queues: Queues): Promise<void> {
	await queues.countersDue.upsertJobScheduler(
		COUNTERS_DUE_SCHEDULER_ID,
		{ every: COUNTERS_DUE_INTERVAL_MS },
		{ name: JobName.ProcessDueCounters, opts: COUNTERS_DUE_JOB_OPTIONS },
	);
}
