import { createPrismaClient, Prisma, type PrismaClient } from '@tgab/db';
import {
	MIGRATIONS_PACKAGE,
	MIGRATIONS_SCRIPT,
	PRISMA_MIGRATIONS_TABLE,
	TEST_DB_COMPOSE_PROFILE,
	TEST_DB_NAME,
	TEST_DB_NAME_SUFFIX,
	TEST_DB_PASSWORD,
	TEST_DB_PORT_DEFAULT,
	TEST_DB_SERVICE,
	TEST_DB_USER,
} from '../constants/test-database.ts';
import { spawnCommand } from './commands.ts';
import { testEnv } from './test-env.ts';

/**
 * Тестовая БД: адрес, подготовка (контейнер и миграции), клиент и очистка таблиц.
 * Используют запускалка (`run-tests.ts`) и интеграционные тесты; позже — e2e.
 */
export class TestDatabase {
	private constructor(readonly url: string) {}

	/**
	 * Адрес из `TEST_DATABASE_URL` или контейнер `postgres-test` по умолчанию.
	 * Имя базы обязано кончаться на `_test`: тесты пишут и очищают таблицы.
	 */
	static fromEnv(): TestDatabase {
		const port = testEnv.POSTGRES_TEST_PORT ?? TEST_DB_PORT_DEFAULT;
		const url =
			testEnv.TEST_DATABASE_URL ??
			`postgresql://${TEST_DB_USER}:${TEST_DB_PASSWORD}@localhost:${port}/${TEST_DB_NAME}`;
		const name = new URL(url).pathname.slice(1);
		if (!name.endsWith(TEST_DB_NAME_SUFFIX)) {
			const reason = 'Тесты пишут и очищают таблицы';
			throw new Error(
				`${reason}, поэтому имя базы должно кончаться на «${TEST_DB_NAME_SUFFIX}», а не «${name}»`,
			);
		}
		return new TestDatabase(url);
	}

	/**
	 * Готовит БД к тестам: локально поднимает контейнер
	 * (в CI базу даёт CI), затем применяет миграции.
	 */
	async prepare(): Promise<void> {
		if (!testEnv.CI) await this.runTestContainer();
		await this.runMigrations();
	}

	createClient(): PrismaClient {
		return createPrismaClient(this.url);
	}

	/**
	 * Очищает все таблицы приложения (кроме служебной таблицы Prisma) —
	 * вызывать в `beforeEach`. Имена таблиц берутся из каталога Postgres,
	 * а не от пользователя, поэтому `Prisma.raw` здесь безопасен.
	 */
	async reset(db: PrismaClient): Promise<void> {
		const tables = await db.$queryRaw<{ tablename: string }[]>`
			SELECT tablename FROM pg_tables
			WHERE schemaname = 'public' AND tablename <> ${PRISMA_MIGRATIONS_TABLE}
		`;
		if (tables.length === 0) return;
		const list = tables.map(({ tablename }) => `"public"."${tablename}"`).join(', ');
		await db.$executeRaw`TRUNCATE ${Prisma.raw(list)} CASCADE`;
	}

	private async runTestContainer(): Promise<void> {
		const exitCode = await spawnCommand([
			'docker',
			'compose',
			'--profile',
			TEST_DB_COMPOSE_PROFILE,
			'up',
			'-d',
			'--wait',
			TEST_DB_SERVICE,
		]);
		if (exitCode !== 0) {
			throw new Error(`Не удалось запустить контейнер ${TEST_DB_SERVICE} — запущен ли Docker?`);
		}
	}

	private async runMigrations(): Promise<void> {
		const exitCode = await spawnCommand(
			['bun', '--filter', MIGRATIONS_PACKAGE, MIGRATIONS_SCRIPT],
			{
				DATABASE_URL: this.url,
			},
		);
		if (exitCode !== 0) throw new Error('Не удалось применить миграции к тестовой БД');
	}
}
