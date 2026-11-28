import { expect, type Locator, type Page } from '@playwright/test';
import { step } from '../step.ts';

/** Идентификаторы списка карточек экрана (`TestId.<Экран>`). */
export interface CardListIds {
	card: string;
	/** Название записи внутри карточки. */
	title: string;
	/** Сообщение пустого списка. */
	empty: string;
}

/**
 * Список карточек (заметки, счётчики): карточка находится по названию — элементу `title` внутри
 * неё, а не по всему тексту карточки (в нём ещё статус, дата, число), — и общие проверки списка.
 */
export class CardListComponent {
	// --- Элементы ---

	readonly cards: Locator;
	readonly titles: Locator;
	readonly empty: Locator;

	constructor(page: Page, ids: CardListIds) {
		this.cards = page.getByTestId(ids.card);
		this.titles = page.getByTestId(ids.title);
		this.empty = page.getByTestId(ids.empty);
	}

	card(title: string): Locator {
		return this.cards.filter({ has: this.titles.filter({ hasText: title }) });
	}

	// --- Проверки ---

	/** Карточка есть в списке (`visible = false` — её нет). */
	async expectCardVisible(title: string, visible = true): Promise<void> {
		await expect(this.card(title)).toBeVisible({ visible });
	}

	/** В списке ровно эти записи, в этом порядке: названия целиком, по одному на карточку. */
	async expectTitles(titles: string[]): Promise<void> {
		await step(`Проверка списка: ${titles.join(', ')}`, async () => {
			await expect(this.cards).toHaveCount(titles.length);
			await expect(this.titles).toHaveText(titles);
		});
	}

	async expectEmpty(): Promise<void> {
		await step('Проверка пустого списка', async () => {
			await expect(this.empty).toBeVisible();
			await expect(this.cards).toHaveCount(0);
		});
	}
}
