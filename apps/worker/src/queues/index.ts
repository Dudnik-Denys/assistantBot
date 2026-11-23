import { type ConnectionOptions, Queue } from 'bullmq';
import { QueueName } from '#worker/constants/queues.ts';

/** Очереди воркера: в них ставятся задачи (планировщик, выборка счётчиков). */
export function createQueues(connection: ConnectionOptions) {
	return {
		countersDue: new Queue(QueueName.CountersDue, { connection }),
		notifications: new Queue(QueueName.Notifications, { connection }),
	};
}

export type Queues = ReturnType<typeof createQueues>;
