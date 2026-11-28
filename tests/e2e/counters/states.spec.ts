import { randomUUID } from 'node:crypto';
import {
	COUNTER_DURATION_REQUIRED_MESSAGE,
	COUNTER_NOT_FOUND_MESSAGE,
	COUNTER_TIMER_MODE,
} from '#core/constants/counters.ts';
import { CounterText } from '#web/lib/constants/counters.ts';
import { UiText } from '#web/lib/constants/ui-texts.ts';
import { test } from '../fixtures.ts';
import { step } from '../step.ts';
import { COUNTER_TITLE } from './data.ts';

/** Адрес списка счётчиков в API: обрывается в сценарии «нет связи». */
const COUNTERS_API = /\/api\/counters(\?|$)/;

test.describe('Счётчики: пустой список, проверка формы, ошибки', () => {
	test('Тест подсказки создать первый счётчик в пустом списке', async ({ countersList }) => {
		await step('Открытие пустого списка', async () => {
			await countersList.open();
			await countersList.expectEmpty();
		});
	});

	test('Тест проверки названия и срока в форме', async ({ countersList, counterForm }) => {
		await step('Открытие формы нового счётчика', async () => {
			await countersList.open();
			await countersList.openNewCounter();
			await counterForm.expectOpened();
			await counterForm.expectSubmitEnabled(false);
		});
		await step('Ввод названия', async () => {
			await counterForm.fillTitle(COUNTER_TITLE);
			await counterForm.expectSubmitEnabled();
		});
		await step('Таймер на срок без срока', async () => {
			await counterForm.selectMode(COUNTER_TIMER_MODE.Duration);
			await counterForm.expectProblem(COUNTER_DURATION_REQUIRED_MESSAGE);
		});
		await step('Ввод срока', async () => {
			await counterForm.fillDuration('hours', 1);
			await counterForm.expectSubmitEnabled();
		});
	});

	test('Тест выхода из формы с несохранёнными изменениями', async ({
		countersList,
		counterForm,
	}) => {
		await step('Ввод названия нового счётчика', async () => {
			await countersList.open();
			await countersList.openNewCounter();
			await counterForm.expectOpened();
			await counterForm.fillTitle(COUNTER_TITLE);
		});
		await step('Выход без сохранения', async () => {
			await counterForm.leaveUnsaved(CounterText.LeaveUnsaved);
			await countersList.expectOpened();
			await countersList.expectEmpty();
		});
	});

	test('Тест страницы ошибки для несуществующего счётчика', async ({ errorPage, mainMenu }) => {
		await step('Открытие несуществующего счётчика по адресу', async () => {
			await errorPage.openAddress(`/counters/${randomUUID()}`);
			await errorPage.expectError(COUNTER_NOT_FOUND_MESSAGE);
		});
		await step('Возврат в меню', async () => {
			await errorPage.goBack();
			await mainMenu.expectOpened();
		});
	});

	test('Тест загрузки списка после восстановления связи', async ({ page, countersList }) => {
		await step('Открытие списка без связи с сервером', async () => {
			await page.route(COUNTERS_API, (route) => route.abort());
			await countersList.open();
			await countersList.listState.expectReconnecting(UiText.Reconnecting);
		});
		await step('Восстановление связи', async () => {
			await page.unroute(COUNTERS_API);
			await countersList.goOnline();
			await countersList.listState.expectLoaded();
			await countersList.expectEmpty();
		});
	});
});
