import { expect, type Locator, type Page } from '@playwright/test';
import { TestId } from '#web/lib/constants/test-ids.ts';
import { answerDialog } from './dialogs.ts';

/**
 * Общее для каждого экрана (`e2e.md`, «Экраны»): адрес, открытие, проверка, «Назад» и ответ
 * на диалог. Элементы, которые есть лишь на части экранов, — компоненты в `components/`.
 */
export abstract class BasePage {
	/** Адрес экрана относительно `baseURL`. */
	abstract readonly path: string;

	/** «Назад» экрана (`BackButton`): вне Telegram — кнопка «‹ Назад» на странице. */
	readonly backButton: Locator;

	constructor(readonly page: Page) {
		this.backButton = page.getByTestId(TestId.Common.Back);
	}

	/** Открыть экран по адресу и дождаться, что он показан. */
	async open(): Promise<void> {
		await this.page.goto(this.path);
		await this.expectOpened();
	}

	/**
	 * «Назад» экрана. Вне Telegram `BackButton` рисует на странице кнопку с тем же обработчиком,
	 * что у системной кнопки Telegram (досохранить, спросить подтверждение), — её и нажимаем.
	 */
	async goBack(): Promise<void> {
		await this.backButton.click();
	}

	/** «Назад» браузера (жест, история) — в обход обработчика экрана; отдельный сценарий. */
	async goBackInBrowser(): Promise<void> {
		await this.page.goBack();
	}

	/** Перезагрузка страницы — проверить, что данные сохранены на сервере, а не только на экране. */
	async reload(): Promise<void> {
		await this.page.reload();
	}

	/**
	 * Сеть вернулась: браузер сообщает об этом событием `online`, и Mini App повторяет запрос
	 * сразу (`ListLoader`). Подмену сети (`page.route`) тест снимает до вызова.
	 */
	async goOnline(): Promise<void> {
		await this.page.evaluate(() => window.dispatchEvent(new Event('online')));
	}

	/** Экран показан: адрес и характерный элемент экрана. */
	async expectOpened(): Promise<void> {
		await expect(this.page).toHaveURL(this.path);
	}

	/**
	 * Диалог, который вызывает `action` (`confirmDialog`, `alertDialog`): ответ `accept` —
	 * согласиться, иначе отказ. Логика — `answerDialog` из `dialogs.ts` (её используют и компоненты).
	 */
	protected async answerDialog(
		action: () => Promise<void>,
		message: string,
		accept = true,
	): Promise<void> {
		await answerDialog(this.page, action, message, accept);
	}
}
