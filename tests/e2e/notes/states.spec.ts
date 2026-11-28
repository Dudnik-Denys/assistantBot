import { randomUUID } from 'node:crypto';
import { NOTE_NOT_FOUND_MESSAGE } from '#core/constants/notes.ts';
import { NoteEditorText } from '#web/lib/constants/notes.ts';
import { UiText } from '#web/lib/constants/ui-texts.ts';
import { test } from '../fixtures.ts';
import { step } from '../step.ts';

/** Адрес списка заметок в API: обрывается в сценарии «нет связи». */
const NOTES_API = /\/api\/notes(\?|$)/;

test.describe('Заметки: пустой список, ошибки, нет связи', () => {
	test('Тест подсказки создать первую заметку в пустом списке', async ({ notesList }) => {
		await step('Открытие пустого списка', async () => {
			await notesList.open();
			await notesList.expectEmpty();
		});
	});

	test('Тест предупреждения о заметке без заголовка', async ({ notesList, noteEditor }) => {
		await step('Ввод текста без заголовка', async () => {
			await notesList.open();
			await notesList.openNewNote();
			await noteEditor.expectOpened();
			await noteEditor.fillContent('текст без заголовка');
			await noteEditor.expectHint(NoteEditorText.UntitledHint);
		});
		await step('Выход без сохранения', async () => {
			await noteEditor.leaveUnsaved(NoteEditorText.LeaveUntitled);
			await notesList.expectEmpty();
		});
	});

	test('Тест страницы ошибки для несуществующей заметки', async ({ errorPage, mainMenu }) => {
		await step('Открытие несуществующей заметки по адресу', async () => {
			await errorPage.openAddress(`/notes/${randomUUID()}`);
			await errorPage.expectError(NOTE_NOT_FOUND_MESSAGE);
		});
		await step('Возврат в меню', async () => {
			await errorPage.goBack();
			await mainMenu.expectOpened();
		});
	});

	test('Тест загрузки списка после восстановления связи', async ({ page, notesList }) => {
		await step('Открытие списка без связи с сервером', async () => {
			await page.route(NOTES_API, (route) => route.abort());
			await notesList.open();
			await notesList.listState.expectReconnecting(UiText.Reconnecting);
		});
		await step('Восстановление связи', async () => {
			await page.unroute(NOTES_API);
			await notesList.goOnline();
			await notesList.listState.expectLoaded();
			await notesList.expectEmpty();
		});
	});
});
