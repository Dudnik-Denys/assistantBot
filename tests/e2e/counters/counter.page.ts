import { expect } from '@playwright/test';
import { TestId } from '#web/lib/constants/test-ids.ts';
import { BasePage } from '../base.page.ts';
import { step } from '../step.ts';

/** Адрес экрана счётчика: `/counters/<id>` (не форма `/counters/new` и не `/edit`). */
const COUNTER_PATH = /\/counters\/(?!new$)[^/]+$/;

/**
 * Экран счётчика (`/counters/<id>`): обратный отсчёт таймера, «− число +», «Старт» / «Стоп»,
 * «Сбросить», «Изменить», «Удалить».
 */
export class CounterPage extends BasePage {
	/** Адрес зависит от id: экран открывают `openById(id)` или переходом из списка. */
	readonly path = '/counters';

	// --- Элементы ---

	readonly countdown = this.page.getByTestId(TestId.Counter.Countdown);
	readonly timerStatus = this.page.getByTestId(TestId.Counter.TimerStatus);
	readonly cycles = this.page.getByTestId(TestId.Counter.Cycles);
	readonly value = this.page.getByTestId(TestId.Counter.Value);
	readonly decrementButton = this.page.getByTestId(TestId.Counter.Decrement);
	readonly incrementButton = this.page.getByTestId(TestId.Counter.Increment);
	readonly startButton = this.page.getByTestId(TestId.Counter.Start);
	readonly stopButton = this.page.getByTestId(TestId.Counter.Stop);
	readonly resetButton = this.page.getByTestId(TestId.Counter.Reset);
	readonly editButton = this.page.getByTestId(TestId.Counter.Edit);
	readonly deleteButton = this.page.getByTestId(TestId.Counter.Delete);

	// --- Действия ---

	/** У экрана нет общего адреса: `open()` открыл бы список. Открывать — `openById(id)`. */
	override async open(): Promise<void> {
		throw new Error('У экрана счётчика адрес с id — используйте counter.openById(id)');
	}

	async openById(id: string): Promise<void> {
		await this.page.goto(`${this.path}/${id}`);
		await this.expectOpened();
	}

	async increment(): Promise<void> {
		await this.incrementButton.click();
	}

	async decrement(): Promise<void> {
		await this.decrementButton.click();
	}

	async start(): Promise<void> {
		await this.startButton.click();
	}

	async stop(): Promise<void> {
		await this.stopButton.click();
	}

	async openSettings(): Promise<void> {
		await this.editButton.click();
	}

	/** «Сбросить» → подтверждение (текст вопроса — из теста). */
	async reset(question: string): Promise<void> {
		await this.answerDialog(() => this.resetButton.click(), question);
	}

	/** «Удалить» → «Вы уверены…?» → «Да». */
	async remove(title: string): Promise<void> {
		await this.answerDialog(() => this.deleteButton.click(), `счётчик «${title}»`);
	}

	// --- Проверки ---

	override async expectOpened(): Promise<void> {
		await step('Проверка экрана счётчика', async () => {
			await expect(this.page).toHaveURL(COUNTER_PATH);
			await expect(this.editButton).toBeVisible();
		});
	}

	async expectValue(value: number): Promise<void> {
		await expect(this.value).toHaveText(String(value));
	}

	async expectDecrementEnabled(enabled = true): Promise<void> {
		await expect(this.decrementButton).toBeEnabled({ enabled });
	}

	async expectCountdown(remaining: string): Promise<void> {
		await expect(this.countdown).toHaveText(remaining);
	}

	async expectCycles(text: string): Promise<void> {
		await expect(this.cycles).toHaveText(text);
	}

	/**
	 * Таймер идёт: подпись под отсчётом (из теста), «Старт» нет, «Стоп» есть — или нет, если
	 * кнопки «Старт» и «Стоп» скрыты в настройках (`stopVisible = false`).
	 */
	async expectRunning(status: string, stopVisible = true): Promise<void> {
		await step('Проверка идущего таймера', async () => {
			await expect(this.timerStatus).toHaveText(status);
			await expect(this.stopButton).toBeVisible({ visible: stopVisible });
			await expect(this.startButton).toBeHidden();
		});
	}

	/** Подпись кнопки продолжения: «Старт» или «Продолжить» (текст — из теста). */
	async expectStartLabel(label: string): Promise<void> {
		await expect(this.startButton).toHaveText(label);
	}

	/** Таймер стоит (пауза или цикл завершён): подпись и кнопка «Старт» вместо «Стоп». */
	async expectStopped(status: string): Promise<void> {
		await step(`Проверка остановленного таймера: «${status}»`, async () => {
			await expect(this.timerStatus).toHaveText(status);
			await expect(this.startButton).toBeVisible();
			await expect(this.stopButton).toBeHidden();
		});
	}
}
