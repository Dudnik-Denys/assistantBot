import { expect, type Response } from '@playwright/test';
import { TestId } from '#web/lib/constants/test-ids.ts';
import { BasePage } from '../base.page.ts';
import { step } from '../step.ts';

/** Ответ на сохранение заметки (создание — POST, изменение — PUT) прошёл успешно. */
function isNoteSaved(response: Response): boolean {
	const method = response.request().method();
	return (
		/\/api\/notes(\/[^/?]+)?$/.test(new URL(response.url()).pathname) &&
		(method === 'POST' || method === 'PUT') &&
		response.ok()
	);
}

/**
 * Редактор заметки (`/notes/new`, `/notes/<id>`): кнопки «Сохранить» нет — изменения сохраняет
 * автосохранение через паузу после ввода.
 */
export class NoteEditorPage extends BasePage {
	readonly path = '/notes/new';

	// --- Элементы ---

	readonly titleInput = this.page.getByTestId(TestId.NoteEditor.Title);
	readonly contentInput = this.page.getByTestId(TestId.NoteEditor.Content);
	readonly hint = this.page.getByTestId(TestId.NoteEditor.Hint);

	// --- Действия ---

	async fill(title: string, content = ''): Promise<void> {
		await step(`Ввод заметки «${title}»`, async () => {
			await this.titleInput.fill(title);
			await this.contentInput.fill(content);
		});
	}

	async fillContent(content: string): Promise<void> {
		await this.contentInput.fill(content);
	}

	/** «Назад» из заметки без заголовка: подтвердить выход без сохранения. */
	async leaveUnsaved(message: string): Promise<void> {
		await this.answerDialog(() => this.goBack(), message);
	}

	// --- Проверки ---

	/** Редактор показан (адрес у новой заметки меняется после сохранения — проверяем поля). */
	override async expectOpened(): Promise<void> {
		await expect(this.titleInput).toBeVisible();
	}

	async expectNote(title: string, content: string): Promise<void> {
		await step(`Проверка заметки «${title}» в редакторе`, async () => {
			await expect(this.titleInput).toHaveValue(title);
			await expect(this.contentInput).toHaveValue(content);
		});
	}

	async expectHint(text: string): Promise<void> {
		await expect(this.hint).toContainText(text);
	}

	// --- Удобные методы ---

	/** Заполнить и дождаться автосохранения: подписка на ответ — до ввода (`e2e.md`, «Гонки»). */
	async fillAndWaitSaved(title: string, content = ''): Promise<void> {
		await step(`Ввод заметки «${title}» и автосохранение`, async () => {
			const saved = this.page.waitForResponse(isNoteSaved);
			await this.fill(title, content);
			await saved;
		});
	}

	/** Изменить текст и дождаться автосохранения. */
	async fillContentAndWaitSaved(content: string): Promise<void> {
		await step('Изменение текста и автосохранение', async () => {
			const saved = this.page.waitForResponse(isNoteSaved);
			await this.fillContent(content);
			await saved;
		});
	}
}
