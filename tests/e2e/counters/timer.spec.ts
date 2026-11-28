import {
	COUNTER_INITIAL_VALUE,
	COUNTER_TARGET_PASSED_MESSAGE,
	COUNTER_TIMER_MODE,
} from '#core/constants/counters.ts';
import { MS_PER_HOUR } from '#core/constants/time.ts';
import { CounterText } from '#web/lib/constants/counters.ts';
import { formatRemaining } from '#web/lib/utils/dates.ts';
import { Temporal } from '#web/lib/utils/temporal.ts';
import {
	createTestDueCounter,
	createTestFinishedCounter,
	createTestTimerCounter,
	TEST_HOUR_TIMER,
} from '../../helpers/factories.ts';
import { test } from '../fixtures.ts';
import { step } from '../step.ts';
import { COUNTER_TITLE } from './data.ts';
import { createCounterViaUi } from './flows/create-counter.ts';

/** Срок таймера в сценариях — час. */
const TIMER_HOURS = 1;
/** Новый срок в настройках идущего таймера. */
const NEW_TIMER_HOURS = 2;
/** Таймер «до даты»: окончание через два дня в это время. */
const TARGET_DAYS_AHEAD = 2;
const TARGET_TIME = '15:30';
/** Начало суток: сегодня в это время — всегда в прошлом. */
const PAST_TIME = '00:00';
/** Обратный отсчёт в момент старта цикла на час. */
const FULL_HOUR_REMAINING = formatRemaining(TEST_HOUR_TIMER.duration.hours * MS_PER_HOUR);

test.describe('Счётчики: таймер', () => {
	test('Тест создания счётчика с таймером на срок', async ({
		countersList,
		counterForm,
		counter,
	}) => {
		await step('Создание счётчика с таймером на час', async () => {
			await countersList.open();
			await createCounterViaUi(countersList, counterForm, counter, {
				title: COUNTER_TITLE,
				hours: TIMER_HOURS,
			});
		});
		await step('Проверка идущего таймера', async () => {
			await counter.expectRunning(CounterText.Remaining);
		});
	});

	test('Тест обратного отсчёта, паузы и продолжения таймера', async ({
		db,
		user,
		page,
		countersList,
		counter,
	}) => {
		const created = await createTestTimerCounter(db, user.id, { title: COUNTER_TITLE });

		await step('Отсчёт в списке в момент старта цикла', async () => {
			// Часы браузера — на старте цикла: отсчёт показывает ровно час (e2e.md, «Данные»).
			await page.clock.setFixedTime(new Date(created.timer.startAt));
			await countersList.open();
			await countersList.expectStatus(
				COUNTER_TITLE,
				CounterText.ListRemaining(FULL_HOUR_REMAINING),
			);
		});
		await step('Отсчёт на экране счётчика', async () => {
			await countersList.openCounter(COUNTER_TITLE);
			await counter.expectOpened();
			await counter.expectCountdown(FULL_HOUR_REMAINING);
			await counter.expectRunning(CounterText.Remaining);
		});
		await step('Пауза кнопкой «Стоп»', async () => {
			await counter.stop();
			await counter.expectStopped(CounterText.Paused);
		});
		await step('Продолжение кнопкой «Старт»', async () => {
			await counter.start();
			await counter.expectRunning(CounterText.Remaining);
		});
	});

	test('Тест окончания цикла на открытом экране счётчика', async ({ db, user, counter }) => {
		// Число — циклы таймера (без ручного управления), следующий цикл — с теми же параметрами.
		const created = await createTestDueCounter(db, user.id, {
			title: COUNTER_TITLE,
			manual: false,
			showValue: true,
			repeatSame: true,
		});

		await step('Окончание цикла без воркера', async () => {
			await counter.openById(created.id);
			await counter.expectStopped(CounterText.Finished);
			await counter.expectCycles(CounterText.Cycles(1));
		});
		await step('Новый цикл кнопкой «Старт»', async () => {
			await counter.start();
			await counter.expectRunning(CounterText.Remaining);
			await counter.expectCycles(CounterText.Cycles(1));
		});
	});

	test('Тест сброса счётчика с таймером', async ({ db, user, counter }) => {
		const created = await createTestTimerCounter(db, user.id, { title: COUNTER_TITLE });

		await step('Изменение числа', async () => {
			await counter.openById(created.id);
			await counter.increment();
			await counter.expectValue(1);
		});
		await step('Сброс счёта и таймера с подтверждением', async () => {
			await counter.reset(CounterText.ResetWithTimer(COUNTER_TITLE));
			await counter.expectValue(COUNTER_INITIAL_VALUE);
			await counter.expectStopped(CounterText.Paused);
		});
	});

	test('Тест перезапуска таймера при сохранении нового срока', async ({
		db,
		user,
		counterForm,
		counter,
	}) => {
		const created = await createTestTimerCounter(db, user.id, { title: COUNTER_TITLE });

		await step('Новый срок в настройках', async () => {
			await counter.openById(created.id);
			await counter.openSettings();
			await counterForm.expectOpened();
			await counterForm.fillDuration('hours', NEW_TIMER_HOURS);
		});
		await step('Сохранение с подтверждением перезапуска', async () => {
			await counterForm.submitConfirmingRestart(CounterText.TimerRestart);
			await counter.expectOpened();
			await counter.expectRunning(CounterText.Remaining);
		});
		await step('Проверка сохранённого срока', async () => {
			await counter.openSettings();
			await counterForm.expectOpened();
			await counterForm.expectDuration('hours', NEW_TIMER_HOURS);
		});
	});

	test('Тест создания счётчика с таймером до даты', async ({
		user,
		countersList,
		counterForm,
		counter,
	}) => {
		// «Сегодня» — в часовом поясе пользователя: в нём форма проверяет и сохраняет дату.
		const today = Temporal.Now.plainDateISO(user.timeZone);
		const targetDate = today.add({ days: TARGET_DAYS_AHEAD }).toString();

		await step('Открытие формы в режиме «До даты»', async () => {
			await countersList.open();
			await countersList.openNewCounter();
			await counterForm.expectOpened();
			await counterForm.fillTitle(COUNTER_TITLE);
			await counterForm.selectMode(COUNTER_TIMER_MODE.Date);
		});
		await step('Окончание в прошлом', async () => {
			await counterForm.fillTarget(today.toString(), PAST_TIME);
			await counterForm.expectProblem(COUNTER_TARGET_PASSED_MESSAGE);
		});
		await step('Создание с окончанием в будущем', async () => {
			await counterForm.fillTarget(targetDate, TARGET_TIME);
			await counterForm.submit();
			await counter.expectOpened();
			await counter.expectRunning(CounterText.Remaining);
		});
		await step('Проверка окончания в настройках', async () => {
			await counter.openSettings();
			await counterForm.expectOpened();
			await counterForm.expectTarget(targetDate, TARGET_TIME);
		});
	});

	test('Тест кнопки «Продолжить» при скрытых «Старт» и «Стоп»', async ({ db, user, counter }) => {
		const created = await createTestFinishedCounter(db, user.id, {
			title: COUNTER_TITLE,
			repeatSame: true,
			startStopHidden: true,
		});

		await step('Завершённый цикл с кнопкой «Продолжить»', async () => {
			await counter.openById(created.id);
			await counter.expectStopped(CounterText.Finished);
			await counter.expectStartLabel(CounterText.Continue);
		});
		await step('Новый цикл без кнопки «Стоп»', async () => {
			await counter.start();
			await counter.expectRunning(CounterText.Remaining, false);
		});
	});
});
