// Временный Postgres для интеграционных тестов. Значения совпадают с
// сервисом в docker-compose.yml: меняя их там, меняй и здесь. Учётные
// данные — не секрет: контейнер только для тестов, данные в памяти.

/** Сервис и профиль в docker-compose.yml. */
export const TEST_DB_SERVICE = 'postgres-test';
export const TEST_DB_COMPOSE_PROFILE = 'test';

/** Порт на хосте по умолчанию — как `${POSTGRES_TEST_PORT:-5434}` в docker-compose.yml. */
export const TEST_DB_PORT_DEFAULT = 5434;
export const TEST_DB_USER = 'tgab';
export const TEST_DB_PASSWORD = 'tgab';
export const TEST_DB_NAME = 'tgab_test';

/** Без этого суффикса в имени базы тесты не запустятся, чтобы не очистить рабочую базу. */
export const TEST_DB_NAME_SUFFIX = '_test';

/** Служебная таблица Prisma: при очистке БД не трогается. */
export const PRISMA_MIGRATIONS_TABLE = '_prisma_migrations';

/** Пакет и его скрипт, которые применяют миграции Prisma. */
export const MIGRATIONS_PACKAGE = '@tgab/db';
export const MIGRATIONS_SCRIPT = 'migrate:deploy';
