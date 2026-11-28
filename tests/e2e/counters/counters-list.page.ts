import { expect, type Locator } from '@playwright/test';
import type { CounterTab } from '#web/lib/constants/counters.ts';
import { TestId, testIdWithValue } from '#web/lib/constants/test-ids.ts';
import { BasePage } from '../base.page.ts';
import { CardListComponent } from '../components/card-list.component.ts';
import { ListStateComponent } from '../components/list-state.component.ts';
import { SwipeRowComponent } from '../components/swipe-row.component.ts';
import { step } from '../step.ts';

/** Список счётчиков (`/counters`): вкладки, карточки со статусом и числом, «+», удаление свайпом. */
export class CountersListPage extends BasePage {
	readonly path = '/counters';

	readonly swipeRows = new SwipeRowComponent(this.page);
	readonly listState = new ListStateComponent(this.page);
	readonly list = new CardListComponent(this.page, {
		card: TestId.CountersList.Card,
		title: TestId.CountersList.Title,
		empty: TestId.CountersList.Empty,
	});

	// --- Элементы ---

	readonly emptyTab = this.page.getByTestId(TestId.CountersList.EmptyTab);
	readonly newCounterButton = this.page.getByTestId(TestId.Common.FloatingButton);

	tab(value: CounterTab): Locator {
		return this.page.getByTestId(testIdWithValue(TestId.CountersList.Tab, value));
	}

	card(title: string): Locator {
		return this.list.card(title);
	}

	status(title: string): Locator {
		return this.card(title).getByTestId(TestId.CountersList.Status);
	}

	value(title: string): Locator {
		return this.card(title).getByTestId(TestId.CountersList.Value);
	}

	// --- Действия ---

	async openNewCounter(): Promise<void> {
		await this.newCounterButton.click();
	}

	async openCounter(title: string): Promise<void> {
		await this.card(title).click();
	}

	async selectTab(value: CounterTab): Promise<void> {
		await this.tab(value).click();
	}

	/** Свайп → «Удалить» → ответ на «Вы уверены…?»: `accept` — «Да», иначе «Нет». */
	async swipeToDelete(title: string, accept = true): Promise<void> {
		await this.swipeRows.swipeToDelete(this.card(title), `счётчик «${title}»`, accept);
	}

	/** Удаление, которое сервер отклонил: после «Да» — сообщение об ошибке (текст — из теста). */
	async swipeToDeleteWithError(title: string, errorText: string): Promise<void> {
		await this.swipeRows.swipeToDeleteWithError(this.card(title), `счётчик «${title}»`, errorText);
	}

	// --- Проверки ---

	override async expectOpened(): Promise<void> {
		await step('Проверка экрана «Счётчики»', async () => {
			await super.expectOpened();
			await expect(this.newCounterButton).toBeVisible();
		});
	}

	async expectTabSelected(value: CounterTab): Promise<void> {
		await expect(this.tab(value)).toBeChecked();
	}

	/** Счётчик есть в списке (`visible = false` — его нет). */
	async expectCounterVisible(title: string, visible = true): Promise<void> {
		await this.list.expectCardVisible(title, visible);
	}

	/** В списке ровно эти счётчики, в этом порядке (новые — сверху). */
	async expectCounters(titles: string[]): Promise<void> {
		await this.list.expectTitles(titles);
	}

	async expectStatus(title: string, status: string): Promise<void> {
		await expect(this.status(title)).toHaveText(status);
	}

	async expectValue(title: string, value: number): Promise<void> {
		await expect(this.value(title)).toHaveText(String(value));
	}

	async expectEmpty(): Promise<void> {
		await this.list.expectEmpty();
	}

	/** Вкладка без счётчиков: её сообщение (текст — из теста) и ни одной карточки. */
	async expectEmptyTab(message: string): Promise<void> {
		await step('Проверка пустой вкладки', async () => {
			await expect(this.emptyTab).toHaveText(message);
			await expect(this.list.cards).toHaveCount(0);
		});
	}
}
