import { COUNTER_TIMER_MODE } from '#core/constants/counters.ts';
import type { CounterPage } from '../counter.page.ts';
import type { CounterFormPage } from '../counter-form.page.ts';
import type { CountersListPage } from '../counters-list.page.ts';

/** Что ввести в форме нового счётчика: название и, если нужен таймер на срок, его часы. */
export interface CounterViaUiInput {
	title: string;
	/** Таймер на срок в часах; нет — счётчик без таймера. */
	hours?: number;
}

/** Новый счётчик через интерфейс: список → «+» → форма → «Создать» → экран счётчика. */
export async function createCounterViaUi(
	countersList: CountersListPage,
	counterForm: CounterFormPage,
	counter: CounterPage,
	{ title, hours }: CounterViaUiInput,
): Promise<void> {
	await countersList.openNewCounter();
	await counterForm.expectOpened();
	await counterForm.fillTitle(title);
	if (hours !== undefined) {
		await counterForm.selectMode(COUNTER_TIMER_MODE.Duration);
		await counterForm.fillDuration('hours', hours);
	}
	await counterForm.submit();
	await counter.expectOpened();
}
