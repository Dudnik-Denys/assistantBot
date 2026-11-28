import { createPrismaClient, type PrismaClient } from '@tgab/db';
import {
	MIGRATIONS_PACKAGE,
	MIGRATIONS_SCRIPT,
	PRISMA_MIGRATIONS_TABLE,
	RESET_KEEP_TABLE_SETTING,
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
 * Очистка всех таблиц, кроме той, чьё имя лежит в настройке `RESET_KEEP_TABLE_SETTING`. Имя
 * настройки вставлено в текст из константы: внутри `DO $$ … $$` параметры запроса не работают.
 */
const RESET_SQL = `
	DO $$
	DECLARE
		tables text;
	BEGIN
		SELECT string_agg(format('%I.%I', schemaname, tablename), ', ') INTO tables
		FROM pg_tables
		WHERE schemaname = 'public'
		AND tablename <> current_setting('${RESET_KEEP_TABLE_SETTING}');
		IF tables IS NOT NULL THEN
			EXECUTE format('TRUNCATE %s CASCADE', tables);
		END IF;
	END
	$$
`;

/**
 * Тестовая БД: адрес, подготовка (контейнер и миграции), клиент и очистка таблиц.
 * Используют запускалка (`run-tests.ts`) и интеграционные тесты и фикстуры e2e.
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
	 * Очищает все таблицы приложения (кроме служебной таблицы Prisma) — вызывать в `beforeEach`.
	 * Список таблиц собирает и экранирует сам Postgres (`format('%I.%I')` в блоке `DO`). Имя
	 * исключаемой таблицы — параметром: в `DO` параметров нет, поэтому оно передаётся через
	 * `set_config` в той же транзакции (`is_local = true` — только до её конца).
	 */
	async reset(db: PrismaClient): Promise<void> {
		await db.$transaction([
			db.$queryRaw`SELECT set_config(${RESET_KEEP_TABLE_SETTING}, ${PRISMA_MIGRATIONS_TABLE}, true)`,
			// Текст SQL — константа модуля, без данных извне: `Unsafe` здесь — исключение `db.md`.
			db.$executeRawUnsafe(RESET_SQL),
		]);
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
