// Запуск тестов: bun run test:<тип> [модуль] [флаги bun test]
//   bun run test:unit                          — все unit-тесты
//   bun run test:integration notes             — только tests/integration/notes
//   bun run test:unit notes -t "префикс"       — один тест по описанию
// Для integration сначала поднимается контейнер postgres-test и применяются миграции.
// В CI (переменная CI) контейнер даёт сам CI — docker compose не вызывается.
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { testDatabaseUrl } from './helpers/test-database.ts';

const TestTypeSchema = z.enum(['unit', 'integration']);
const TESTS_DIR = import.meta.dirname;
const ROOT_DIR = path.resolve(TESTS_DIR, '..');

const [rawType, ...args] = process.argv.slice(2);
const type = TestTypeSchema.safeParse(rawType);
if (!type.success) fail(`Тип тестов: ${TestTypeSchema.options.join(' | ')}`);

const moduleName = args[0] && !args[0].startsWith('-') ? args.shift() : undefined;
const typeDir = path.join(TESTS_DIR, type.data);
if (moduleName && !existsSync(path.join(typeDir, moduleName))) {
	fail(`Нет папки tests/${type.data}/${moduleName}. Модули: ${listModules(typeDir).join(', ')}`);
}

const env: Record<string, string | undefined> = { ...process.env };
if (type.data === 'integration') env.TEST_DATABASE_URL = await prepareTestDatabase();

const target = `./${path.join('tests', type.data, moduleName ?? '')}`;
const tests = Bun.spawn(['bun', 'test', target, ...args], {
	cwd: ROOT_DIR,
	env,
	stdio: ['inherit', 'inherit', 'inherit'],
});
process.exit(await tests.exited);

/** Поднимает тестовую БД (локально — контейнер) и применяет к ней миграции; возвращает её адрес. */
async function prepareTestDatabase(): Promise<string> {
	const url = testDatabaseUrl();
	if (!process.env.CI) {
		await run(
			['docker', 'compose', '--profile', 'test', 'up', '-d', '--wait', 'postgres-test'],
			'Не удалось запустить контейнер postgres-test — запущен ли Docker?',
		);
	}
	await run(
		['bun', '--filter', '@tgab/db', 'migrate:deploy'],
		'Не удалось применить миграции к тестовой БД',
		{ DATABASE_URL: url },
	);
	return url;
}

async function run(cmd: string[], errorMessage: string, extraEnv: Record<string, string> = {}) {
	const proc = Bun.spawn(cmd, {
		cwd: ROOT_DIR,
		env: { ...process.env, ...extraEnv },
		stdio: ['inherit', 'inherit', 'inherit'],
	});
	if ((await proc.exited) !== 0) fail(errorMessage);
}

function listModules(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map((entry) => entry.name);
}

function fail(message: string): never {
	console.error(`${message}\nИспользование: bun run test:<тип> [модуль] [флаги bun test]`);
	process.exit(1);
}
