// Добавляет telegramId в allowlist: bun run user:allow <telegramId> [--admin]
// .env подключает корневой скрипт `user:allow` (`bun --env-file=.env`).
import { createPrismaClient } from '@tgab/db';
import { DatabaseUrlSchema, TelegramIdSchema } from '../src/env.ts';
import { createUsersService } from '../src/users/service.ts';

const [rawId, ...flags] = process.argv.slice(2);
const telegramId = TelegramIdSchema.safeParse(rawId ?? '');
if (!telegramId.success) {
	console.error('Использование: bun run user:allow <telegramId> [--admin]');
	process.exit(1);
}

const databaseUrl = DatabaseUrlSchema.safeParse(process.env.DATABASE_URL);
if (!databaseUrl.success) {
	console.error('DATABASE_URL не задан (см. README, «Переменные окружения»)');
	process.exit(1);
}

const db = createPrismaClient(databaseUrl.data);
try {
	const user = await createUsersService(db).allow(telegramId.data, {
		isAdmin: flags.includes('--admin'),
	});
	console.log(`OK: ${user.telegramId} (admin: ${user.isAdmin})`);
} finally {
	await db.$disconnect();
}
