import path from 'node:path';
import { TESTS_DIR } from './paths.ts';

/** Порт web для e2e: не 5173, чтобы не мешать `bun run dev`, запущенному для разработки. */
export const E2E_PORT = 5183;
export const E2E_BASE_URL = `http://localhost:${E2E_PORT}`;

/**
 * telegramId, от имени которого Mini App работает в e2e (`DEV_TELEGRAM_ID` web-сервера тестов);
 * фикстуры перед каждым тестом добавляют его в allowlist.
 */
export const E2E_TELEGRAM_ID = 900_000_001n;

/**
 * Каталог `.env` для web-сервера тестов (`TGAB_ENV_DIR`) — папка без `.env`: e2e не читают
 * рабочие переменные и секреты, всё нужное web получает через `webServer.env`.
 */
export const E2E_ENV_DIR = path.join(TESTS_DIR, 'e2e');

/**
 * Устройства — проекты Playwright (`e2e.md`, «Конфиг»): маленький, средний и большой iPhone,
 * все на WebKit. Имена — из описаний устройств Playwright (`devices`).
 */
export const E2E_DEVICES = {
	small: 'iPhone 12 Mini',
	medium: 'iPhone 16',
	large: 'iPhone 16 Pro Max',
} as const;

/** Сколько ждать запуска web-сервера (первая сборка Vite). */
export const E2E_WEB_SERVER_TIMEOUT_MS = 120_000;

/**
 * Лимит времени на один тест (со всеми шагами и фикстурами). Явно, а не умолчание Playwright
 * (30 с): WebKit и `vite dev` медленнее на первых тестах, а сценарии с таймером дольше.
 */
export const E2E_TEST_TIMEOUT_MS = 60_000;

/** Сколько проверка `expect(…)` ждёт нужного состояния (умолчание Playwright — 5 с). */
export const E2E_EXPECT_TIMEOUT_MS = 10_000;

/**
 * Папки результатов — в `tests/` (все в `.gitignore`). Пути абсолютные: репортер Allure считает
 * относительный путь от папки запуска (корень репозитория), а не от конфига.
 */
export const E2E_ALLURE_RESULTS_DIR = path.join(TESTS_DIR, 'allure-results');
export const E2E_HTML_REPORT_DIR = path.join(TESTS_DIR, 'playwright-report');
export const E2E_OUTPUT_DIR = path.join(TESTS_DIR, 'test-results');
