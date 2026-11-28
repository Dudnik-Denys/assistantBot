import { Section } from '#web/lib/constants/sections.ts';
import { createTestNote } from '../../helpers/factories.ts';
import { test } from '../fixtures.ts';
import { openSection } from '../main-menu/flows/open-section.ts';
import { step } from '../step.ts';
import { createNoteViaUi } from './flows/create-note.ts';

const TITLE = 'Покупки';
const CONTENT = 'молоко, хлеб';
const DELETE_ERROR = 'Не удалось удалить заметку';

test.describe('Заметки: создание, изменение, удаление', () => {
	test('Тест создания заметки из главного меню', { tag: '@smoke' }, async ({
		mainMenu,
		notesList,
		noteEditor,
	}) => {
		await step('Вход в раздел «Заметки»', async () => {
			await openSection(mainMenu, Section.Notes.title, notesList);
		});
		await step('Создание заметки', async () => {
			await createNoteViaUi(notesList, noteEditor, TITLE, CONTENT);
		});
		await step('Проверка заметки в списке', async () => {
			await notesList.expectNotes([TITLE]);
		});
	});

	test('Тест изменения текста заметки', async ({ db, user, notesList, noteEditor }) => {
		await createTestNote(db, user.id, { title: TITLE, content: CONTENT });

		await step('Открытие заметки', async () => {
			await notesList.open();
			await notesList.openNote(TITLE);
			await noteEditor.expectOpened();
		});
		await step('Изменение текста', async () => {
			await noteEditor.fillContentAndWaitSaved('сыр');
			await noteEditor.goBack();
		});
		await step('Проверка сохранённого текста', async () => {
			await notesList.openNote(TITLE);
			await noteEditor.expectNote(TITLE, 'сыр');
		});
	});

	test('Тест удаления заметки свайпом', { tag: '@smoke' }, async ({ db, user, notesList }) => {
		await createTestNote(db, user.id, { title: TITLE });

		await step('Удаление свайпом с подтверждением', async () => {
			await notesList.open();
			await notesList.swipeToDelete(TITLE);
			await notesList.expectNoteVisible(TITLE, false);
		});
		await step('Проверка после перезагрузки', async () => {
			await notesList.reload();
			await notesList.expectEmpty();
		});
	});

	test('Тест отмены удаления заметки', async ({ db, user, notesList }) => {
		await createTestNote(db, user.id, { title: TITLE });

		await step('Отказ в подтверждении удаления', async () => {
			await notesList.open();
			await notesList.swipeToDelete(TITLE, false);
		});
		await step('Проверка заметки в списке', async () => {
			await notesList.expectNoteVisible(TITLE);
		});
	});

	test('Тест ошибки сервера при удалении заметки', async ({ db, user, page, notesList }) => {
		const note = await createTestNote(db, user.id, { title: TITLE });

		await step('Удаление, которое сервер отклонил', async () => {
			await page.route(`**/api/notes/${note.id}`, (route) =>
				route.request().method() === 'DELETE'
					? route.fulfill({ status: 500, json: { error: DELETE_ERROR } })
					: route.fallback(),
			);
			await notesList.open();
			await notesList.swipeToDeleteWithError(TITLE, DELETE_ERROR);
		});
		await step('Проверка заметки в списке', async () => {
			await notesList.expectNoteVisible(TITLE);
		});
	});

	test('Тест возврата из заметки кнопкой «Назад» браузера', async ({
		db,
		user,
		notesList,
		noteEditor,
	}) => {
		await createTestNote(db, user.id, { title: TITLE });

		await step('Открытие заметки из списка', async () => {
			await notesList.open();
			await notesList.openNote(TITLE);
			await noteEditor.expectOpened();
		});
		await step('«Назад» браузера', async () => {
			await noteEditor.goBackInBrowser();
			await notesList.expectOpened();
			await notesList.expectNoteVisible(TITLE);
		});
	});
});
