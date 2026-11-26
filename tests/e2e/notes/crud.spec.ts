import { createTestNote } from '../../helpers/factories.ts';
import { test } from '../fixtures.ts';
import { openSection } from '../main-menu/flows/open-section.ts';
import { step } from '../step.ts';
import { createNoteViaUi } from './flows/create-note.ts';

const TITLE = 'Покупки';
const CONTENT = 'молоко, хлеб';

test.describe('Заметки: создание, изменение, удаление', () => {
	test('Создание заметки из главного меню', { tag: '@smoke' }, async ({
		mainMenu,
		notesList,
		noteEditor,
	}) => {
		await step('Вход в раздел «Заметки»', async () => {
			await openSection(mainMenu, 'Заметки', notesList);
		});
		await step('Создание заметки', async () => {
			await createNoteViaUi(notesList, noteEditor, TITLE, CONTENT);
		});
		await step('Проверка заметки в списке', async () => {
			await notesList.expectNotes([TITLE]);
		});
	});

	test('Изменение текста заметки', async ({ db, user, notesList, noteEditor }) => {
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

	test('Удаление заметки свайпом', { tag: '@smoke' }, async ({ db, user, page, notesList }) => {
		await createTestNote(db, user.id, { title: TITLE });

		await step('Удаление свайпом с подтверждением', async () => {
			await notesList.open();
			await notesList.swipeToDelete(TITLE);
			await notesList.expectNoteVisible(TITLE, false);
		});
		await step('Проверка после перезагрузки', async () => {
			await page.reload();
			await notesList.expectEmpty();
		});
	});

	test('Отмена удаления оставляет заметку', async ({ db, user, notesList }) => {
		await createTestNote(db, user.id, { title: TITLE });

		await step('Отказ в подтверждении удаления', async () => {
			await notesList.open();
			await notesList.swipeToDelete(TITLE, false);
		});
		await step('Проверка заметки в списке', async () => {
			await notesList.expectNoteVisible(TITLE);
		});
	});
});
