import type { Locator, Page } from '@playwright/test';
import { TestId } from '#web/lib/constants/test-ids.ts';

/** Шагов движения мыши при свайпе: одним `pointermove` жест не распознаётся. */
const SWIPE_STEPS = 10;

/**
 * Строки списка со свайпом (`SwipeActions`): свайп влево открывает действия справа («Удалить»).
 * Жест — на pointer-событиях и принимает мышь, поэтому свайп — движение мыши (`e2e.md`,
 * «Удаление свайпом»).
 */
export class SwipeRowComponent {
	// --- Элементы ---

	readonly rows: Locator;

	constructor(private readonly page: Page) {
		this.rows = page.getByTestId(TestId.Common.SwipeRow);
	}

	/** Строка с этим текстом. */
	row(text: string): Locator {
		return this.rows.filter({ hasText: text });
	}

	deleteButton(text: string): Locator {
		return this.row(text).getByTestId(TestId.Common.SwipeDelete);
	}

	// --- Действия ---

	/** Свайп строки влево — от правого края на всю её ширину: действия открываются целиком. */
	async swipeOpen(text: string): Promise<void> {
		const row = this.row(text);
		// Координаты нужны от видимой строки: дождаться её без действия (e2e.md, «Гонки», п. 7).
		await row.waitFor();
		const box = await row.boundingBox();
		if (!box) throw new Error(`Строка «${text}» не видна`);
		const y = box.y + box.height / 2;
		await this.page.mouse.move(box.x + box.width - 1, y);
		await this.page.mouse.down();
		await this.page.mouse.move(box.x + 1, y, { steps: SWIPE_STEPS });
		await this.page.mouse.up();
	}
}
