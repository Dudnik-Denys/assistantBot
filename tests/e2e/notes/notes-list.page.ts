import { expect, type Locator } from '@playwright/test';
import { TestId } from '#web/lib/constants/test-ids.ts';
import { BasePage } from '../base.page.ts';
import { CardListComponent } from '../components/card-list.component.ts';
import { ListStateComponent } from '../components/list-state.component.ts';
import { SearchBarComponent } from '../components/search-bar.component.ts';
import { SwipeRowComponent } from '../components/swipe-row.component.ts';
import { step } from '../step.ts';

/** Список заметок (`/notes`): поиск, карточки, «+», удаление свайпом. */
export class NotesListPage extends BasePage {
	readonly path = '/notes';

	readonly searchBar = new SearchBarComponent(this.page);
	readonly swipeRows = new SwipeRowComponent(this.page);
	readonly listState = new ListStateComponent(this.page);
	readonly list = new CardListComponent(this.page, {
		card: TestId.NotesList.Card,
		title: TestId.NotesList.Title,
		empty: TestId.NotesList.Empty,
	});

	// --- Элементы ---

	readonly notFound = this.page.getByTestId(TestId.NotesList.NotFound);
	readonly newNoteButton = this.page.getByTestId(TestId.Common.FloatingButton);

	card(title: string): Locator {
		return this.list.card(title);
	}

	// --- Действия ---

	async openNewNote(): Promise<void> {
		await this.newNoteButton.click();
	}

	async openNote(title: string): Promise<void> {
		await this.card(title).click();
	}

	async search(query: string): Promise<void> {
		await this.searchBar.search(query);
	}

	async clearSearch(): Promise<void> {
		await this.searchBar.clear();
	}

	/** Свайп → «Удалить» → ответ на «Вы уверены…?»: `accept` — «Да», иначе «Нет». */
	async swipeToDelete(title: string, accept = true): Promise<void> {
		await this.swipeRows.swipeToDelete(this.card(title), `заметку «${title}»`, accept);
	}

	/** Удаление, которое сервер отклонил: после «Да» — сообщение об ошибке (текст — из теста). */
	async swipeToDeleteWithError(title: string, errorText: string): Promise<void> {
		await this.swipeRows.swipeToDeleteWithError(this.card(title), `заметку «${title}»`, errorText);
	}

	// --- Проверки ---

	override async expectOpened(): Promise<void> {
		await step('Проверка экрана «Заметки»', async () => {
			await super.expectOpened();
			await expect(this.searchBar.input).toBeVisible();
		});
	}

	/** Заметка есть в списке (`visible = false` — её нет). */
	async expectNoteVisible(title: string, visible = true): Promise<void> {
		await this.list.expectCardVisible(title, visible);
	}

	/** В списке ровно эти заметки, в этом порядке. */
	async expectNotes(titles: string[]): Promise<void> {
		await this.list.expectTitles(titles);
	}

	async expectEmpty(): Promise<void> {
		await this.list.expectEmpty();
	}

	async expectNothingFound(): Promise<void> {
		await expect(this.notFound).toBeVisible();
	}
}
