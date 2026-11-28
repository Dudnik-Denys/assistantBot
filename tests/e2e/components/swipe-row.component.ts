import type { Locator, Page } from '@playwright/test';
import { TestId } from '#web/lib/constants/test-ids.ts';
import { answerDialog, answerDialogWithError } from '../dialogs.ts';
import { step } from '../step.ts';

/** Шагов движения мыши при свайпе: одним `pointermove` жест не распознаётся. */
const SWIPE_STEPS = 10;

/**
 * Строки списка со свайпом (`SwipeActions`): свайп влево открывает действия справа («Удалить»).
 * Жест — на pointer-событиях и принимает мышь, поэтому свайп — движение мыши (`e2e.md`,
 * «Удаление свайпом»). Строка выбирается по элементу внутри неё — карточке, которую экран
 * нашёл по названию (`CardListComponent.card`).
 */
export class SwipeRowComponent {
	// --- Элементы ---

	readonly rows: Locator;

	constructor(private readonly page: Page) {
		this.rows = page.getByTestId(TestId.Common.SwipeRow);
	}

	/** Строка, в которой лежит `item`. */
	row(item: Locator): Locator {
		return this.rows.filter({ has: item });
	}

	deleteButton(item: Locator): Locator {
		return this.row(item).getByTestId(TestId.Common.SwipeDelete);
	}

	// --- Действия ---

	/** Свайп строки влево — от правого края на всю её ширину: действия открываются целиком. */
	async swipeOpen(item: Locator): Promise<void> {
		const row = this.row(item);
		// Координаты нужны от видимой строки: дождаться её без действия (e2e.md, «Гонки», п. 7).
		await row.waitFor();
		const box = await row.boundingBox();
		if (!box) throw new Error('Строка списка не видна');
		const y = box.y + box.height / 2;
		await this.page.mouse.move(box.x + box.width - 1, y);
		await this.page.mouse.down();
		await this.page.mouse.move(box.x + 1, y, { steps: SWIPE_STEPS });
		await this.page.mouse.up();
	}

	/**
	 * Свайп → «Удалить» → ответ на «Вы уверены, что хотите удалить {subject}?»: `accept` — «Да»,
	 * иначе «Нет». `subject` — как в вопросе: `заметку «Покупки»`, `счётчик «Бег»`.
	 */
	async swipeToDelete(item: Locator, subject: string, accept = true): Promise<void> {
		await step(`Удаление свайпом: ${subject}`, async () => {
			await this.swipeOpen(item);
			await answerDialog(this.page, () => this.deleteButton(item).click(), subject, accept);
		});
	}

	/** Удаление, которое сервер отклонил: свайп → «Удалить» → «Да» → сообщение об ошибке. */
	async swipeToDeleteWithError(item: Locator, subject: string, errorText: string): Promise<void> {
		await step(`Удаление свайпом с ошибкой сервера: ${subject}`, async () => {
			await this.swipeOpen(item);
			await answerDialogWithError(
				this.page,
				() => this.deleteButton(item).click(),
				subject,
				errorText,
			);
		});
	}
}
