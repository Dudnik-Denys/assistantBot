import { expect, type Locator } from '@playwright/test';
import { TestId } from '#web/lib/constants/test-ids.ts';
import { BasePage } from '../base.page.ts';
import { ListStateComponent } from '../components/list-state.component.ts';
import { SearchBarComponent } from '../components/search-bar.component.ts';
import { SwipeRowComponent } from '../components/swipe-row.component.ts';

/** Список заметок (`/notes`): поиск, карточки, «+», удаление свайпом. */
export class NotesListPage extends BasePage {
	readonly path = '/notes';

	readonly searchBar = new SearchBarComponent(this.page);
	readonly swipeRows = new SwipeRowComponent(this.page);
	readonly listState = new ListStateComponent(this.page);

	// --- Элементы ---

	readonly cards = this.page.getByTestId(TestId.NotesList.Card);
	readonly empty = this.page.getByTestId(TestId.NotesList.Empty);
	readonly notFound = this.page.getByTestId(TestId.NotesList.NotFound);
	readonly newNoteButton = this.page.getByTestId(TestId.Common.FloatingButton);

	card(title: string): Locator {
		return this.cards.filter({ hasText: title });
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
		await this.swipeRows.swipeOpen(title);
		await this.answerDialog(
			() => this.swipeRows.deleteButton(title).click(),
			`заметку «${title}»`,
			accept,
		);
	}

	// --- Проверки ---

	override async expectOpened(): Promise<void> {
		await super.expectOpened();
		await expect(this.searchBar.input).toBeVisible();
	}

	/** Заметка есть в списке (`visible = false` — её нет). */
	async expectNoteVisible(title: string, visible = true): Promise<void> {
		await expect(this.card(title)).toBeVisible({ visible });
	}

	/** В списке ровно эти заметки, в этом порядке. */
	async expectNotes(titles: string[]): Promise<void> {
		await expect(this.cards).toHaveCount(titles.length);
		await expect(this.cards).toContainText(titles);
	}

	async expectEmpty(): Promise<void> {
		await expect(this.empty).toBeVisible();
		await expect(this.cards).toHaveCount(0);
	}

	async expectNothingFound(): Promise<void> {
		await expect(this.notFound).toBeVisible();
	}
}
