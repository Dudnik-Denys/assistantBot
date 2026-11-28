import { expect } from '@playwright/test';
import { TestId } from '#web/lib/constants/test-ids.ts';
import { BasePage } from '../base.page.ts';

/** Страница ошибки (`+error.svelte`): неизвестный адрес, запись не найдена, сбой загрузки. */
export class ErrorPage extends BasePage {
	/** Адрес — тот, на котором случилась ошибка; страницу открывают переходом, а не по адресу. */
	readonly path = '/';

	// --- Элементы ---

	readonly message = this.page.getByTestId(TestId.ErrorPage.Message);

	// --- Действия ---

	/** Адреса у страницы ошибки нет: `open()` открыл бы главную. Открывать — `openAddress()`. */
	override async open(): Promise<void> {
		throw new Error(
			'У страницы ошибки нет своего адреса — используйте errorPage.openAddress(path)',
		);
	}

	/** Открыть адрес, который должен закончиться ошибкой. */
	async openAddress(path: string): Promise<void> {
		await this.page.goto(path);
	}

	// --- Проверки ---

	override async expectOpened(): Promise<void> {
		await expect(this.message).toBeVisible();
	}

	async expectError(title: string): Promise<void> {
		await expect(this.message).toContainText(title);
	}
}
