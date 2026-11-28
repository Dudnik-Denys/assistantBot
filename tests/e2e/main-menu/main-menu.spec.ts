import { test } from '../fixtures.ts';
import { step } from '../step.ts';

test.describe('Главное меню', () => {
	test('Тест списка разделов на главной', { tag: '@smoke' }, async ({ mainMenu }) => {
		await step('Открытие главной', async () => {
			await mainMenu.open();
		});
		await step('Проверка разделов', async () => {
			await mainMenu.expectSections(['Заметки', 'Счётчики', 'Напоминания']);
		});
	});
});
