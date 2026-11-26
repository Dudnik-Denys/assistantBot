import { createTestNote } from '../../helpers/factories.ts';
import { test } from '../fixtures.ts';
import { step } from '../step.ts';

test.describe('Заметки: поиск', () => {
	test.beforeEach(async ({ db, user }) => {
		await createTestNote(db, user.id, { title: 'Список покупок' });
		await createTestNote(db, user.id, { title: 'Погода в Киеве' });
	});

	test('Поиск заметки по началу слова', async ({ notesList }) => {
		await step('Открытие списка', async () => {
			await notesList.open();
		});
		await step('Поиск по началу слова', async () => {
			await notesList.search('покуп');
			await notesList.expectNotes(['Список покупок']);
		});
	});

	test('Пустой результат и очистка поиска', async ({ notesList }) => {
		await step('Поиск без совпадений', async () => {
			await notesList.open();
			await notesList.search('отпуск');
			await notesList.expectNothingFound();
		});
		await step('Очистка поиска', async () => {
			await notesList.clearSearch();
			await notesList.expectNotes(['Погода в Киеве', 'Список покупок']);
		});
	});
});
