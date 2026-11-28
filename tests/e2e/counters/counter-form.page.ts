import { expect, type Locator } from '@playwright/test';
import type { COUNTER_DURATION_PARTS } from '#core/constants/counters.ts';
import {
	COUNTER_DURATION_LABELS,
	type CounterTimerModeOption,
} from '#web/lib/constants/counters.ts';
import { TestId, testIdWithValue } from '#web/lib/constants/test-ids.ts';
import { BasePage } from '../base.page.ts';
import { step } from '../step.ts';

/** Часть срока таймера: месяцы, недели, дни, часы, минуты. */
export type DurationPart = (typeof COUNTER_DURATION_PARTS)[number];

/**
 * Форма счётчика: новый (`/counters/new`) и настройки (`/counters/<id>/edit`). Сохраняется
 * кнопкой «Создать» / «Сохранить», а не автосохранением.
 */
export class CounterFormPage extends BasePage {
	readonly path = '/counters/new';

	// --- Элементы ---

	readonly titleInput = this.page.getByTestId(TestId.CounterForm.Title);
	readonly problem = this.page.getByTestId(TestId.CounterForm.Problem);
	readonly submitButton = this.page.getByTestId(TestId.CounterForm.Submit);
	readonly targetDateInput = this.page.getByTestId(TestId.CounterForm.TargetDate);
	readonly targetTimeInput = this.page.getByTestId(TestId.CounterForm.TargetTime);

	mode(value: CounterTimerModeOption): Locator {
		return this.page.getByTestId(testIdWithValue(TestId.CounterForm.Mode, value));
	}

	durationPart(part: DurationPart): Locator {
		return this.page.getByTestId(testIdWithValue(TestId.CounterForm.DurationPart, part));
	}

	// --- Действия ---

	/**
	 * Ввод и закрытие клавиатуры (фокус уходит с поля): пока она открыта, панель с кнопкой
	 * «Создать» / «Сохранить» скрыта (`ActionBar`, вариант `typing:`), — как и у пользователя.
	 */
	async fillTitle(title: string): Promise<void> {
		await step(`Ввод названия «${title}»`, async () => {
			await this.titleInput.fill(title);
			await this.titleInput.blur();
		});
	}

	async selectMode(value: CounterTimerModeOption): Promise<void> {
		await this.mode(value).click();
	}

	/** Часть срока таймера и закрытие клавиатуры (см. `fillTitle`). */
	async fillDuration(part: DurationPart, value: number): Promise<void> {
		await step(`Ввод срока: ${COUNTER_DURATION_LABELS[part]} — ${value}`, async () => {
			await this.durationPart(part).fill(String(value));
			await this.durationPart(part).blur();
		});
	}

	/**
	 * Окончание таймера «до даты»: дата `YYYY-MM-DD` и время `HH:mm` (как значения системных
	 * полей), затем закрытие клавиатуры (см. `fillTitle`).
	 */
	async fillTarget(date: string, time: string): Promise<void> {
		await step(`Ввод окончания ${date} ${time}`, async () => {
			await this.targetDateInput.fill(date);
			await this.targetTimeInput.fill(time);
			await this.closeDateTimeKeyboard();
		});
	}

	/**
	 * Закрыть выбор даты и времени. В WebKit фокус полей `date` и `time` стоит в их встроенных
	 * частях, и `blur()` самого поля его не снимает — панель с кнопкой осталась бы скрытой
	 * (`typing:`). Фокус переводится в текстовое поле названия и снимается там.
	 */
	private async closeDateTimeKeyboard(): Promise<void> {
		await this.titleInput.focus();
		await this.titleInput.blur();
	}

	/** «Создать» / «Сохранить». */
	async submit(): Promise<void> {
		await this.submitButton.click();
	}

	/** «Сохранить» с новыми параметрами идущего таймера: подтвердить перезапуск (текст — из теста). */
	async submitConfirmingRestart(message: string): Promise<void> {
		await this.answerDialog(() => this.submit(), message);
	}

	/** «Назад» с несохранёнными изменениями: подтвердить выход (текст вопроса — из теста). */
	async leaveUnsaved(message: string): Promise<void> {
		await this.answerDialog(() => this.goBack(), message);
	}

	// --- Проверки ---

	/** Форма показана (адрес у новой и у настроек разный — проверяем поле названия). */
	override async expectOpened(): Promise<void> {
		await expect(this.titleInput).toBeVisible();
	}

	async expectTitle(title: string): Promise<void> {
		await expect(this.titleInput).toHaveValue(title);
	}

	async expectDuration(part: DurationPart, value: number): Promise<void> {
		await expect(this.durationPart(part)).toHaveValue(String(value));
	}

	/** Окончание таймера «до даты» в полях формы. */
	async expectTarget(date: string, time: string): Promise<void> {
		await step(`Проверка окончания ${date} ${time} в форме`, async () => {
			await expect(this.targetDateInput).toHaveValue(date);
			await expect(this.targetTimeInput).toHaveValue(time);
		});
	}

	async expectSubmitEnabled(enabled = true): Promise<void> {
		await expect(this.submitButton).toBeEnabled({ enabled });
	}

	/** Что мешает сохранить: сообщение под формой и неактивная кнопка. */
	async expectProblem(message: string): Promise<void> {
		await step(`Проверка сообщения формы «${message}»`, async () => {
			await expect(this.problem).toHaveText(message);
			await this.expectSubmitEnabled(false);
		});
	}
}
