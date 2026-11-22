// Запуск тестов: bun run test:<тип> [модуль] [флаги bun test]
//   bun run test:unit                          — все unit-тесты
//   bun run test:integration notes             — только tests/integration/notes
//   bun run test:unit notes -t "Поиск"         — тесты, в описании которых есть «Поиск»
// Для integration сначала готовится тестовая БД (TestDatabase.prepare: контейнер и миграции).
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { ROOT_DIR, TESTS_DIR } from './constants/paths.ts';
import { spawnCommand } from './helpers/commands.ts';
import { TestDatabase } from './helpers/test-database.ts';
import { TestTypeSchema } from './schemas/cli.ts';

const USAGE = 'Использование: bun run test:<тип> [модуль] [флаги bun test]';

const [rawType, ...args] = process.argv.slice(2);
const type = TestTypeSchema.safeParse(rawType);
if (!type.success) fail(`Тип тестов: ${TestTypeSchema.options.join(' | ')}`);

const moduleName = args[0] && !args[0].startsWith('-') ? args.shift() : undefined;
const typeDir = path.join(TESTS_DIR, type.data);
if (moduleName && !existsSync(path.join(typeDir, moduleName))) {
	fail(`Нет папки tests/${type.data}/${moduleName}. Модули: ${listModules(typeDir).join(', ')}`);
}

const extraEnv: Record<string, string> = {};
if (type.data === 'integration') extraEnv.TEST_DATABASE_URL = await prepareTestDatabase();

const target = `./${path.relative(ROOT_DIR, path.join(typeDir, moduleName ?? ''))}`;
process.exit(await runBunTest(target, args, extraEnv));

/** Готовит тестовую БД и возвращает её адрес — его получат тесты через `TEST_DATABASE_URL`. */
async function prepareTestDatabase(): Promise<string> {
	try {
		const testDatabase = TestDatabase.fromEnv();
		await testDatabase.prepare();
		return testDatabase.url;
	} catch (error) {
		fail(error instanceof Error ? error.message : String(error));
	}
}

function runBunTest(target: string, bunTestArgs: string[], env: Record<string, string>) {
	return spawnCommand(['bun', 'test', target, ...bunTestArgs], env);
}

function listModules(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map((entry) => entry.name);
}

function fail(message: string): never {
	console.error(`${message}\n${USAGE}`);
	process.exit(1);
}
