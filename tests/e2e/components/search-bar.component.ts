import type { Locator, Page } from '@playwright/test';
import { TestId } from '#web/lib/constants/test-ids.ts';

/** Поиск (`SearchBar`) — у экранов-списков с поиском. */
export class SearchBarComponent {
	// --- Элементы ---

	readonly input: Locator;
	readonly clearButton: Locator;

	constructor(page: Page) {
		this.input = page.getByTestId(TestId.Common.Search);
		this.clearButton = page.getByTestId(TestId.Common.SearchClear);
	}

	// --- Действия ---

	async search(query: string): Promise<void> {
		await this.input.fill(query);
	}

	async clear(): Promise<void> {
		await this.clearButton.click();
	}
}
