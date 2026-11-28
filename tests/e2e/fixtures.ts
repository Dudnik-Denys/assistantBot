import path from 'node:path';
import { test as base } from '@playwright/test';
import type { PrismaClient, User } from '@tgab/db';
import { feature } from 'allure-js-commons';
import { E2E_TELEGRAM_ID } from '../constants/e2e.ts';
import { createTestUser } from '../helpers/factories.ts';
import { TestDatabase } from '../helpers/test-database.ts';
import { ErrorPage } from './error/error.page.ts';
import { MainMenuPage } from './main-menu/main-menu.page.ts';
import { NoteEditorPage } from './notes/note-editor.page.ts';
import { NotesListPage } from './notes/notes-list.page.ts';

const E2E_DIR = import.meta.dirname;

interface TestFixtures {
	/** Очистка тестовой БД перед каждым тестом (автоматически). */
	// biome-ignore lint/suspicious/noConfusingVoidType: auto-фикстура Playwright без значения — `use()` вызывается без аргумента, что допускает только `void`.
	cleanDatabase: void;
	/** Метка Allure `feature` по папке модуля теста (автоматически). */
	// biome-ignore lint/suspicious/noConfusingVoidType: то же — auto-фикстура без значения.
	allureFeature: void;
	/** Пользователь, от имени которого работает Mini App (`E2E_TELEGRAM_ID`); данные — его. */
	user: User;
	mainMenu: MainMenuPage;
	errorPage: ErrorPage;
	notesList: NotesListPage;
	noteEditor: NoteEditorPage;
}

interface WorkerFixtures {
	/** Клиент тестовой БД — для фабрик (`tests/helpers/factories.ts`). */
	db: PrismaClient;
}

/**
 * Фикстуры e2e (`e2e.md`, «Структура»): экраны — сюда, `new XPage(page)` в тестах не пишется.
 * Автоматически перед каждым тестом: `cleanDatabase` — очистка БД, `user` — пользователь из
 * allowlist (после очистки), `allureFeature` — метка Allure по папке модуля (`tests/e2e/<модуль>/…`).
 */
export const test = base.extend<TestFixtures, WorkerFixtures>({
	db: [
		// biome-ignore lint/correctness/noEmptyPattern: Playwright определяет зависимости фикстуры по разбору первого аргумента — у фикстуры без зависимостей он обязан быть `{}`.
		async ({}, use) => {
			const db = TestDatabase.fromEnv().createClient();
			await use(db);
			await db.$disconnect();
		},
		{ scope: 'worker' },
	],
	cleanDatabase: [
		async ({ db }, use) => {
			await TestDatabase.fromEnv().reset(db);
			await use();
		},
		{ auto: true },
	],
	allureFeature: [
		// biome-ignore lint/correctness/noEmptyPattern: Playwright определяет зависимости фикстуры по разбору первого аргумента — у фикстуры без зависимостей он обязан быть `{}`.
		async ({}, use, testInfo) => {
			await feature(path.relative(E2E_DIR, testInfo.file).split(path.sep)[0] ?? '');
			await use();
		},
		{ auto: true },
	],
	user: [
		async ({ db, cleanDatabase: _cleanDatabase }, use) => {
			await use(await createTestUser(db, { telegramId: E2E_TELEGRAM_ID }));
		},
		{ auto: true },
	],
	mainMenu: async ({ page }, use) => {
		await use(new MainMenuPage(page));
	},
	errorPage: async ({ page }, use) => {
		await use(new ErrorPage(page));
	},
	notesList: async ({ page }, use) => {
		await use(new NotesListPage(page));
	},
	noteEditor: async ({ page }, use) => {
		await use(new NoteEditorPage(page));
	},
});

export { expect } from '@playwright/test';
