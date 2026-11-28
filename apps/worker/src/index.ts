import { autoRetry } from '@grammyjs/auto-retry';
import { createCountersService, createNotificationsService } from '@tgab/core';
import { createPrismaClient } from '@tgab/db';
import { Worker } from 'bullmq';
import { Api } from 'grammy';
import {
	NOTIFICATIONS_LIMITER,
	QueueName,
	WORKER_SHUTDOWN_TIMEOUT_MS,
} from '#worker/constants/queues.ts';
import { env } from '#worker/env.ts';
import { createCounterNotificationJob } from '#worker/jobs/counter-notification.ts';
import { createCountersDueJob } from '#worker/jobs/counters-due.ts';
import { createQueues } from '#worker/queues/index.ts';
import { scheduleRepeatingJobs } from '#worker/schedulers.ts';

// Источник истины — Postgres: Redis только транспорт задач (CLAUDE.md, «Architecture»).
const db = createPrismaClient(env.DATABASE_URL);
const counters = createCountersService(db);
const notifications = createNotificationsService(db);

// Только отправка сообщений: обновления получает бот (long polling), воркер их не трогает.
const api = new Api(env.BOT_TOKEN);
api.config.use(autoRetry());

const connection = { url: env.REDIS_URL };
const queues = createQueues(connection);

const workers = [
	new Worker(
		QueueName.CountersDue,
		createCountersDueJob({ counters, notifications, notificationsQueue: queues.notifications }),
		{ connection },
	),
	new Worker(
		QueueName.Notifications,
		createCounterNotificationJob({ notifications, api, miniAppUrl: env.MINI_APP_URL }),
		{ connection, limiter: NOTIFICATIONS_LIMITER },
	),
];
for (const worker of workers) {
	worker.on('failed', (job, error) =>
		console.error(`Задача ${worker.name}/${job?.id ?? '?'} не выполнена:`, error.message),
	);
	worker.on('error', (error) => console.error(`Воркер ${worker.name}:`, error));
}
// Без слушателя BullMQ молча глотает ошибки очереди (сбой Redis при постановке задач).
for (const queue of Object.values(queues)) {
	queue.on('error', (error) => console.error(`Очередь ${queue.name}:`, error));
}

await scheduleRepeatingJobs(queues);
console.log('Воркер запущен: очереди', Object.values(QueueName).join(', '));

let stopping = false;

/**
 * Остановка: дождаться текущих задач, закрыть очереди и БД. Второй сигнал игнорируется;
 * зависшая остановка через `WORKER_SHUTDOWN_TIMEOUT_MS` завершает процесс принудительно.
 */
const shutdown = async () => {
	if (stopping) return;
	stopping = true;
	setTimeout(() => {
		console.error('Воркер не остановился вовремя — завершаю принудительно');
		process.exit(1);
	}, WORKER_SHUTDOWN_TIMEOUT_MS).unref();
	try {
		await Promise.all(workers.map((worker) => worker.close()));
		await Promise.all(Object.values(queues).map((queue) => queue.close()));
		await db.$disconnect();
	} catch (error) {
		console.error('Ошибка при остановке воркера:', error);
		process.exitCode = 1;
	}
};
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
