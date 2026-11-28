// Добавляет telegramId в allowlist: bun run user:allow <telegramId> [--admin]
// .env подключает корневой скрипт `user:allow` (`bun --env-file=.env`).
import { createPrismaClient } from '@tgab/db';
import { parseEnv } from '../src/env/index.ts';
import { AllowUserArgsSchema, AllowUserEnvSchema } from '../src/schemas/env/allow-user.ts';
import { createUsersService } from '../src/users/service.ts';

function parseOrExit<T>(parse: () => T): T {
	try {
		return parse();
	} catch (error) {
		console.error(error instanceof Error ? error.message : error);
		process.exit(1);
	}
}

const [telegramId, ...flags] = process.argv.slice(2);
const args = parseOrExit(() =>
	parseEnv(AllowUserArgsSchema, 'Использование: bun run user:allow <telegramId> [--admin]', {
		telegramId,
		admin: flags.includes('--admin'),
	}),
);
const env = parseOrExit(() =>
	parseEnv(
		AllowUserEnvSchema,
		'Некорректные переменные окружения (см. README, «Переменные окружения»):',
	),
);

const db = createPrismaClient(env.DATABASE_URL);
try {
	const user = await createUsersService(db).allow(args.telegramId, { isAdmin: args.admin });
	console.log(`OK: ${user.telegramId} (admin: ${user.isAdmin})`);
} finally {
	await db.$disconnect();
}
