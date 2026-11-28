import { COUNTER_INITIAL_VALUE } from '#core/constants/counters.ts';
import { CounterText } from '#web/lib/constants/counters.ts';
import { Section } from '#web/lib/constants/sections.ts';
import { createTestCounter } from '../../helpers/factories.ts';
import { test } from '../fixtures.ts';
import { openSection } from '../main-menu/flows/open-section.ts';
import { step } from '../step.ts';
import { COUNTER_TITLE } from './data.ts';
import { createCounterViaUi } from './flows/create-counter.ts';

const NEW_TITLE = 'Приседания';
/** Ответ сервера, который тест подставляет при удалении. */
const DELETE_ERROR = 'Не удалось удалить счётчик';

test.describe('Счётчики: создание, счёт, изменение, удаление', () => {
	test('Тест создания ручного счётчика из главного меню', { tag: '@smoke' }, async ({
		mainMenu,
		countersList,
		counterForm,
		counter,
	}) => {
		await step('Вход в раздел «Счётчики»', async () => {
			await openSection(mainMenu, Section.Counters.title, countersList);
		});
		await step('Создание счётчика без таймера', async () => {
			await createCounterViaUi(countersList, counterForm, counter, { title: COUNTER_TITLE });
			await counter.expectValue(COUNTER_INITIAL_VALUE);
		});
		await step('Возврат в список', async () => {
			await counter.goBack();
			await countersList.expectOpened();
			await countersList.expectCounters([COUNTER_TITLE]);
			await countersList.expectStatus(COUNTER_TITLE, CounterText.Manual);
		});
	});

	test('Тест ручного счёта и сброса', async ({ db, user, counter }) => {
		const created = await createTestCounter(db, user.id, { title: COUNTER_TITLE });

		await step('Изменение числа кнопками', async () => {
			await counter.openById(created.id);
			await counter.increment();
			await counter.expectValue(1);
			await counter.increment();
			await counter.expectValue(2);
			await counter.decrement();
			await counter.expectValue(1);
		});
		await step('Проверка после перезагрузки', async () => {
			await counter.reload();
			await counter.expectValue(1);
		});
		await step('Сброс с подтверждением', async () => {
			await counter.reset(CounterText.ResetValue(COUNTER_TITLE));
			await counter.expectValue(COUNTER_INITIAL_VALUE);
			await counter.expectDecrementEnabled(false);
		});
	});

	test('Тест изменения названия в настройках', async ({
		db,
		user,
		countersList,
		counterForm,
		counter,
	}) => {
		const created = await createTestCounter(db, user.id, { title: COUNTER_TITLE });

		await step('Открытие настроек', async () => {
			await counter.openById(created.id);
			await counter.openSettings();
			await counterForm.expectOpened();
			await counterForm.expectTitle(COUNTER_TITLE);
		});
		await step('Сохранение нового названия', async () => {
			await counterForm.fillTitle(NEW_TITLE);
			await counterForm.submit();
			await counter.expectOpened();
		});
		await step('Проверка названия в списке', async () => {
			await counter.goBack();
			await countersList.expectOpened();
			await countersList.expectCounters([NEW_TITLE]);
		});
	});

	test('Тест удаления счётчика свайпом из списка', { tag: '@smoke' }, async ({
		db,
		user,
		countersList,
	}) => {
		await createTestCounter(db, user.id, { title: COUNTER_TITLE });

		await step('Удаление свайпом с подтверждением', async () => {
			await countersList.open();
			await countersList.swipeToDelete(COUNTER_TITLE);
			await countersList.expectCounterVisible(COUNTER_TITLE, false);
		});
		await step('Проверка после перезагрузки', async () => {
			await countersList.reload();
			await countersList.expectEmpty();
		});
	});

	test('Тест удаления счётчика с экрана счётчика', async ({ db, user, countersList, counter }) => {
		const created = await createTestCounter(db, user.id, { title: COUNTER_TITLE });

		await step('Удаление кнопкой «Удалить»', async () => {
			await counter.openById(created.id);
			await counter.remove(COUNTER_TITLE);
		});
		await step('Проверка пустого списка', async () => {
			await countersList.expectOpened();
			await countersList.expectEmpty();
		});
	});

	test('Тест возврата из счётчика кнопкой «Назад» браузера', async ({
		db,
		user,
		countersList,
		counter,
	}) => {
		await createTestCounter(db, user.id, { title: COUNTER_TITLE });

		await step('Открытие счётчика из списка', async () => {
			await countersList.open();
			await countersList.openCounter(COUNTER_TITLE);
			await counter.expectOpened();
		});
		await step('«Назад» браузера', async () => {
			await counter.goBackInBrowser();
			await countersList.expectOpened();
			await countersList.expectCounterVisible(COUNTER_TITLE);
		});
	});

	test('Тест ошибки сервера при удалении счётчика', async ({ db, user, page, countersList }) => {
		const created = await createTestCounter(db, user.id, { title: COUNTER_TITLE });

		await step('Удаление, которое сервер отклонил', async () => {
			await page.route(`**/api/counters/${created.id}`, (route) =>
				route.request().method() === 'DELETE'
					? route.fulfill({ status: 500, json: { error: DELETE_ERROR } })
					: route.fallback(),
			);
			await countersList.open();
			await countersList.swipeToDeleteWithError(COUNTER_TITLE, DELETE_ERROR);
		});
		await step('Проверка счётчика в списке', async () => {
			await countersList.expectCounterVisible(COUNTER_TITLE);
		});
	});
});
