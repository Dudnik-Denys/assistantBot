import { expect, type Page } from '@playwright/test';

/**
 * Диалоги Mini App вне Telegram (`confirmDialog`, `alertDialog` — это `window.confirm` /
 * `window.alert`), `e2e.md`, «Диалоги». Функции, а не методы `BasePage`: диалог вызывают и
 * экраны (через `BasePage.answerDialog`), и компоненты (строка списка со свайпом).
 */

/**
 * Ответ на диалог, который вызывает `action`: подписка — до действия, иначе Playwright сам
 * закроет диалог отменой; текст проверяется, ответ — `accept` (согласиться) или отказ.
 */
export async function answerDialog(
	page: Page,
	action: () => Promise<void>,
	message: string,
	accept = true,
): Promise<void> {
	const dialog = page.waitForEvent('dialog');
	// Действие не завершится, пока диалог открыт: ждём его вместе с ответом.
	const done = action();
	const shown = await dialog;
	expect(shown.message()).toContain(message);
	await (accept ? shown.accept() : shown.dismiss());
	await done;
}

/**
 * Подтверждение, после которого действие не удалось: «Да» на вопрос `message`, затем сообщение
 * об ошибке (`alert`) с текстом `errorText`. Подписка на сообщение — до действия.
 */
export async function answerDialogWithError(
	page: Page,
	action: () => Promise<void>,
	message: string,
	errorText: string,
): Promise<void> {
	const alert = page.waitForEvent('dialog', { predicate: (dialog) => dialog.type() === 'alert' });
	await answerDialog(page, action, message);
	const shown = await alert;
	expect(shown.message()).toContain(errorText);
	await shown.accept();
}
