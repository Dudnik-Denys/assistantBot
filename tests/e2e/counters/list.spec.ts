import {
	COUNTER_EMPTY_TAB_MESSAGES,
	COUNTER_TAB_ALL,
	CounterText,
} from '#web/lib/constants/counters.ts';
import {
	createTestCounter,
	createTestDueCounter,
	createTestFinishedCounter,
	createTestPausedCounter,
	createTestTimerCounter,
} from '../../helpers/factories.ts';
import { test } from '../fixtures.ts';
import { step } from '../step.ts';

// Названия не совпадают со статусами карточек («Ручной счётчик», «На паузе · …»).
const MANUAL = 'Вода';
const RUNNING = 'Бег';
const PAUSED = 'Чтение';
const FINISHED = 'Сон';

test.describe('Счётчики: вкладки списка', () => {
	test('Тест вкладок списка по состоянию таймера', async ({ db, user, countersList }) => {
		// Порядок создания задаёт порядок в списке: новые — сверху.
		await createTestCounter(db, user.id, { title: MANUAL });
		await createTestTimerCounter(db, user.id, { title: RUNNING });
		await createTestPausedCounter(db, user.id, { title: PAUSED });
		await createTestFinishedCounter(db, user.id, { title: FINISHED });

		await step('Все счётчики на вкладке «Все»', async () => {
			await countersList.open();
			await countersList.expectTabSelected(COUNTER_TAB_ALL);
			await countersList.expectCounters([FINISHED, PAUSED, RUNNING, MANUAL]);
		});
		await step('Вкладка «Идут»', async () => {
			await countersList.selectTab('running');
			await countersList.expectTabSelected('running');
			await countersList.expectCounters([RUNNING]);
		});
		await step('Вкладка «Пауза»', async () => {
			await countersList.selectTab('paused');
			await countersList.expectTabSelected('paused');
			await countersList.expectCounters([PAUSED]);
		});
		await step('Вкладка «Завершены»', async () => {
			await countersList.selectTab('finished');
			await countersList.expectTabSelected('finished');
			await countersList.expectCounters([FINISHED]);
		});
	});

	test('Тест сообщения пустой вкладки', async ({ db, user, countersList }) => {
		await createTestCounter(db, user.id, { title: MANUAL });

		await step('Вкладка «Идут» без идущих счётчиков', async () => {
			await countersList.open();
			await countersList.selectTab('running');
			await countersList.expectEmptyTab(COUNTER_EMPTY_TAB_MESSAGES.running);
		});
	});

	test('Тест окончания цикла на открытом списке', async ({ db, user, countersList }) => {
		await createTestDueCounter(db, user.id, { title: RUNNING });

		await step('Окончание цикла без воркера', async () => {
			await countersList.open();
			await countersList.expectStatus(RUNNING, CounterText.Finished);
		});
		await step('Счётчик на вкладке «Завершены»', async () => {
			await countersList.selectTab('finished');
			await countersList.expectCounters([RUNNING]);
		});
	});
});
