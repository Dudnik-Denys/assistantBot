// Добавляет telegramId в allowlist: bun run user:allow <telegramId> [--admin]
// .env подключает корневой скрипт `user:allow` (`bun --env-file=.env`).
import { createPrismaClient } from '@tgab/db';
import { z } from 'zod';
import { TelegramIdSchema } from '../src/env.ts';
import { createUsersService } from '../src/users/service.ts';

const [rawId, ...flags] = process.argv.slice(2);
const telegramId = TelegramIdSchema.safeParse(rawId ?? '');
if (!telegramId.success) {
	console.error('Использование: bun run user:allow <telegramId> [--admin]');
	process.exit(1);
}

const env = z.object({ DATABASE_URL: z.string().min(1) }).safeParse(process.env);
if (!env.success) {
	console.error('DATABASE_URL не задан (см. README, «Переменные окружения»)');
	process.exit(1);
}

const db = createPrismaClient(env.data.DATABASE_URL);
const user = await createUsersService(db).allow(telegramId.data, {
	isAdmin: flags.includes('--admin'),
});
console.log(`OK: ${user.telegramId} (admin: ${user.isAdmin})`);
await db.$disconnect();
