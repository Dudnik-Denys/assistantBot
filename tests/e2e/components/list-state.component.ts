import { expect, type Locator, type Page } from '@playwright/test';
import { TestId } from '#web/lib/constants/test-ids.ts';

/** Состояния экрана-списка (`ListState`): загрузка и повторы связи, «нет связи», ошибка. */
export class ListStateComponent {
	// --- Элементы ---

	readonly loading: Locator;
	readonly offline: Locator;
	readonly error: Locator;

	constructor(page: Page) {
		this.loading = page.getByTestId(TestId.Common.Loading);
		this.offline = page.getByTestId(TestId.Common.Offline);
		this.error = page.getByTestId(TestId.Common.ListError);
	}

	// --- Проверки ---

	/** Первая загрузка не удалась — идут повторы связи (текст — из теста). */
	async expectReconnecting(text: string): Promise<void> {
		await expect(this.loading).toContainText(text);
	}

	async expectLoaded(): Promise<void> {
		await expect(this.loading).toBeHidden();
		await expect(this.error).toBeHidden();
	}
}
