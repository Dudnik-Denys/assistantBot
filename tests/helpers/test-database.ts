import { createPrismaClient, Prisma, type PrismaClient } from '@tgab/db';

/** Адрес тестовой БД по умолчанию — контейнер `postgres-test` из docker-compose.yml (данные в памяти). */
const TEST_DATABASE_URL_DEFAULT = `postgresql://tgab:tgab@localhost:${process.env.POSTGRES_TEST_PORT ?? 5434}/tgab_test`;

/** Суффикс имени тестовой БД: без него тесты не запустятся, чтобы не очистить рабочую базу. */
const TEST_DATABASE_SUFFIX = '_test';

/** Адрес тестовой БД (`TEST_DATABASE_URL` или контейнер по умолчанию); имя базы обязано кончаться на `_test`. */
export function testDatabaseUrl(): string {
	const url = process.env.TEST_DATABASE_URL || TEST_DATABASE_URL_DEFAULT;
	const name = new URL(url).pathname.slice(1);
	if (!name.endsWith(TEST_DATABASE_SUFFIX)) {
		throw new Error(
			`Тесты пишут и очищают таблицы, поэтому имя базы должно кончаться на «${TEST_DATABASE_SUFFIX}», а не «${name}»`,
		);
	}
	return url;
}

export function createTestDb(): PrismaClient {
	return createPrismaClient(testDatabaseUrl());
}

/**
 * Очищает все таблицы приложения (кроме служебной `_prisma_migrations`) — вызывать в `beforeEach`.
 * Имена таблиц берутся из каталога Postgres, а не от пользователя, поэтому `Prisma.raw` здесь безопасен.
 */
export async function resetDb(db: PrismaClient): Promise<void> {
	const tables = await db.$queryRaw<{ tablename: string }[]>`
		SELECT tablename FROM pg_tables
		WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
	`;
	if (tables.length === 0) return;
	const list = tables.map(({ tablename }) => `"public"."${tablename}"`).join(', ');
	await db.$executeRaw`TRUNCATE ${Prisma.raw(list)} CASCADE`;
}
