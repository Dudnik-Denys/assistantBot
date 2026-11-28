import { randomUUID } from 'node:crypto';
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
			await noteEditor.fillContent('текст без заголовка');
			await noteEditor.expectHint('Укажите заголовок');
		});
		await step('Выход без сохранения', async () => {
			await noteEditor.leaveUnsaved('без заголовка не сохранится');
			await notesList.expectEmpty();
		});
	});

	test('Тест страницы ошибки для несуществующей заметки', async ({ errorPage, mainMenu }) => {
		await step('Открытие несуществующей заметки по адресу', async () => {
			await errorPage.openAddress(`/notes/${randomUUID()}`);
			await errorPage.expectError('Заметка не найдена');
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
			await notesList.listState.expectReconnecting('Идёт попытка соединения');
		});
		await step('Восстановление связи', async () => {
			await page.unroute(NOTES_API);
			// Браузер сообщает о вернувшейся сети событием online — приложение повторяет запрос сразу.
			await page.evaluate(() => window.dispatchEvent(new Event('online')));
			await notesList.listState.expectLoaded();
			await notesList.expectEmpty();
		});
	});
});
