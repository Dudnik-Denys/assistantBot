import { expect, type Locator } from '@playwright/test';
import { TestId } from '#web/lib/constants/test-ids.ts';
import { BasePage } from '../base.page.ts';
import { step } from '../step.ts';

/** Главная (`/`): список разделов, вход в любой модуль. */
export class MainMenuPage extends BasePage {
	readonly path = '/';

	// --- Элементы ---

	readonly list = this.page.getByTestId(TestId.MainMenu.List);
	readonly sections = this.page.getByTestId(TestId.MainMenu.Section);

	section(title: string): Locator {
		return this.sections.filter({ hasText: title });
	}

	// --- Действия ---

	async openSection(title: string): Promise<void> {
		await this.section(title).click();
	}

	// --- Проверки ---

	override async expectOpened(): Promise<void> {
		await step('Проверка главного меню', async () => {
			await super.expectOpened();
			await expect(this.list).toBeVisible();
		});
	}

	/** Разделы меню — ровно эти и в этом порядке. */
	async expectSections(titles: string[]): Promise<void> {
		await step(`Проверка разделов меню: ${titles.join(', ')}`, async () => {
			await expect(this.sections).toHaveCount(titles.length);
			await expect(this.sections).toContainText(titles);
		});
	}
}
