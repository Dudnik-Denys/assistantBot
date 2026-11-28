import { defineConfig, devices } from '@playwright/test';
import {
	E2E_ALLURE_RESULTS_DIR,
	E2E_BASE_URL,
	E2E_DEVICES,
	E2E_ENV_DIR,
	E2E_EXPECT_TIMEOUT_MS,
	E2E_HTML_REPORT_DIR,
	E2E_OUTPUT_DIR,
	E2E_PORT,
	E2E_TELEGRAM_ID,
	E2E_TEST_TIMEOUT_MS,
	E2E_WEB_SERVER_TIMEOUT_MS,
} from './constants/e2e.ts';
import { ROOT_DIR } from './constants/paths.ts';
import { TestDatabase } from './helpers/test-database.ts';

// e2e Mini App (правила — .claude/rules/e2e.md). Запуск — `bun run test:e2e [модуль]`:
// запускалка готовит тестовую БД и передаёт её адрес (TEST_DATABASE_URL).

const testDatabase = TestDatabase.fromEnv();

export default defineConfig({
	testDir: './e2e',
	testMatch: '**/*.spec.ts',
	outputDir: E2E_OUTPUT_DIR,
	// Одна тестовая БД на все тесты: параллельный тест стёр бы чужие данные (e2e.md, «Гонки», п. 5).
	workers: 1,
	fullyParallel: false,
	// Лимиты времени — явно (e2e.md, «Конфиг»).
	timeout: E2E_TEST_TIMEOUT_MS,
	expect: { timeout: E2E_EXPECT_TIMEOUT_MS },
	forbidOnly: Boolean(process.env.CI),
	reporter: [
		['list'],
		['allure-playwright', { resultsDir: E2E_ALLURE_RESULTS_DIR }],
		['html', { open: 'never', outputFolder: E2E_HTML_REPORT_DIR }],
	],
	use: {
		baseURL: E2E_BASE_URL,
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure',
		// Без анимаций: компоненты отключают переходы через `motion-reduce:` (e2e.md, «Конфиг»).
		contextOptions: { reducedMotion: 'reduce' },
	},
	projects: Object.entries(E2E_DEVICES).map(([name, device]) => ({
		name,
		use: { ...devices[device] },
	})),
	webServer: {
		command: `bun run --cwd apps/web dev --port ${E2E_PORT} --strictPort`,
		cwd: ROOT_DIR,
		url: E2E_BASE_URL,
		// Свой сервер на каждый прогон: чужой на этом порту мог бы смотреть в другую БД.
		reuseExistingServer: false,
		timeout: E2E_WEB_SERVER_TIMEOUT_MS,
		env: {
			TGAB_ENV_DIR: E2E_ENV_DIR,
			DATABASE_URL: testDatabase.url,
			DEV_TELEGRAM_ID: String(E2E_TELEGRAM_ID),
		},
	},
});
