import {
	COUNTER_DEFAULT_TIME,
	COUNTER_DURATION_REQUIRED_MESSAGE,
	COUNTER_EMPTY_DURATION,
	COUNTER_START_REQUIRED_MESSAGE,
	COUNTER_TARGET_PASSED_MESSAGE,
	COUNTER_TARGET_REQUIRED_MESSAGE,
	COUNTER_TIMER_MODE,
	COUNTER_TITLE_MAX,
	COUNTER_TITLE_REQUIRED_MESSAGE,
	COUNTER_TITLE_TOO_LONG_MESSAGE,
} from '@tgab/core/constants/counters';
import type { CounterDto, CounterInput } from '#lib/api.ts';
import { COUNTER_NO_TIMER, type CounterTimerModeOption } from '#lib/constants/counters.ts';
import { formatPlainDateTime, Temporal, toPlainDateTime } from '#lib/utils/temporal.ts';

/**
 * Дата и время полей → `2026-11-24T12:00` для API; пусто, если поле пустое (сохранить тогда
 * не даст `problem`).
 */
function localDateTime(date: Temporal.PlainDate | null, time: Temporal.PlainTime | null): string {
	return date && time ? formatPlainDateTime(date.toPlainDateTime(time)) : '';
}

/**
 * Состояние формы счётчика: поля, ввод для API (`input`), есть ли изменения (`dirty`) и что
 * мешает сохранить (`problem`). Даты и время полей — `Temporal.PlainDate` и `PlainTime` в
 * часовом поясе пользователя (null — поле пустое); по умолчанию старт —
 * сегодня, окончание — завтра, оба в `COUNTER_DEFAULT_TIME` (12:00).
 *
 * Создавать в <script> формы: `const form = new CounterFormState(counter, api.user.timeZone)`,
 * поля — `bind:value={form.title}`.
 */
export class CounterFormState {
	/** Сегодня в поясе пользователя — раньше дату окончания выбрать нельзя. */
	readonly today: Temporal.PlainDate;
	/** Сейчас на циферблате в поясе пользователя. */
	readonly #now: Temporal.PlainDateTime;
	readonly #initialKey: string;
	readonly #initialTimerKey: string;

	title = $state('');
	mode = $state<CounterTimerModeOption>(COUNTER_NO_TIMER);
	/** Старт цикла на срок задан вручную; false — «Старт — текущее время» (момент сохранения). */
	customStart = $state(false);
	startDate = $state<Temporal.PlainDate | null>(null);
	startTime = $state<Temporal.PlainTime | null>(null);
	duration = $state({ ...COUNTER_EMPTY_DURATION });
	targetDate = $state<Temporal.PlainDate | null>(null);
	targetTime = $state<Temporal.PlainTime | null>(null);
	manual = $state(true);
	showValue = $state(true);
	repeatSame = $state(false);
	autoRestart = $state(false);
	notify = $state(true);
	startStopHidden = $state(false);

	hasTimer = $derived(this.mode !== COUNTER_NO_TIMER);

	/** Ввод для API. Без таймера — только ручной, автоповтор — только с «теми же параметрами». */
	input = $derived.by<CounterInput>(() => ({
		title: this.title,
		manual: !this.hasTimer || this.manual,
		showValue: this.showValue,
		timer:
			this.mode === COUNTER_TIMER_MODE.Duration
				? {
						mode: this.mode,
						customStart: this.customStart,
						// Без своего старта время из полей не отправляется: старт — момент сохранения.
						startAt: this.customStart ? localDateTime(this.startDate, this.startTime) : undefined,
						duration: this.duration,
					}
				: this.mode === COUNTER_TIMER_MODE.Date
					? { mode: this.mode, targetAt: localDateTime(this.targetDate, this.targetTime) }
					: null,
		repeatSame: this.mode === COUNTER_TIMER_MODE.Duration && this.repeatSame,
		autoRestart: this.mode === COUNTER_TIMER_MODE.Duration && this.repeatSame && this.autoRestart,
		notify: this.notify,
		startStopHidden: this.startStopHidden,
	}));

	/** Почему нельзя сохранить (те же тексты, что у сервера) или null. */
	problem = $derived.by(() => {
		if (!this.title.trim()) return COUNTER_TITLE_REQUIRED_MESSAGE;
		// Поле не даст ввести больше, но у старых счётчиков название могло быть длиннее.
		if (this.title.trim().length > COUNTER_TITLE_MAX) return COUNTER_TITLE_TOO_LONG_MESSAGE;
		const durationEmpty = Object.values(this.duration).every((part) => !part);
		if (this.mode === COUNTER_TIMER_MODE.Duration && durationEmpty)
			return COUNTER_DURATION_REQUIRED_MESSAGE;
		// В поле даты или времени iOS есть «Сбросить» — значение может стать пустым.
		if (
			this.mode === COUNTER_TIMER_MODE.Duration &&
			this.customStart &&
			(!this.startDate || !this.startTime)
		)
			return COUNTER_START_REQUIRED_MESSAGE;
		if (this.mode === COUNTER_TIMER_MODE.Date && (!this.targetDate || !this.targetTime))
			return COUNTER_TARGET_REQUIRED_MESSAGE;
		if (
			this.mode === COUNTER_TIMER_MODE.Date &&
			this.targetDate &&
			this.targetTime &&
			Temporal.PlainDateTime.compare(this.targetDate.toPlainDateTime(this.targetTime), this.#now) <=
				0
		)
			return COUNTER_TARGET_PASSED_MESSAGE;
		return null;
	});

	/** Есть несохранённые изменения (реактивно: `input` — `$derived`). */
	get dirty(): boolean {
		return JSON.stringify(this.input) !== this.#initialKey;
	}

	/**
	 * Изменились параметры таймера — при сохранении текущий цикл начнётся заново (так же решает
	 * сервер: старт «в момент сохранения» без других изменений таймер не трогает).
	 */
	get timerDirty(): boolean {
		return JSON.stringify(this.input.timer) !== this.#initialTimerKey;
	}

	/** counter — счётчик для изменения; нет — новый. now — для тестов. */
	constructor(counter: CounterDto | undefined, timeZone: string, now = Temporal.Now.instant()) {
		this.#now = now.toZonedDateTimeISO(timeZone).toPlainDateTime();
		this.today = this.#now.toPlainDate();
		const defaultTime = Temporal.PlainTime.from(COUNTER_DEFAULT_TIME);

		// Время в форме — до минуты (после паузы цикл сдвинут с секундами).
		const timer = counter?.timer;
		const start =
			timer?.mode === COUNTER_TIMER_MODE.Duration
				? toPlainDateTime(timer.startAt, timeZone).round({
						smallestUnit: 'minute',
						roundingMode: 'trunc',
					})
				: this.today.toPlainDateTime(defaultTime);
		const target =
			timer?.mode === COUNTER_TIMER_MODE.Date
				? toPlainDateTime(timer.targetAt, timeZone).round({
						smallestUnit: 'minute',
						roundingMode: 'trunc',
					})
				: this.today.add({ days: 1 }).toPlainDateTime(defaultTime);

		this.title = counter?.title ?? '';
		this.mode = timer?.mode ?? COUNTER_NO_TIMER;
		this.customStart = timer?.customStart ?? false;
		this.startDate = start.toPlainDate();
		this.startTime = start.toPlainTime();
		this.duration = { ...(timer?.duration ?? COUNTER_EMPTY_DURATION) };
		this.targetDate = target.toPlainDate();
		this.targetTime = target.toPlainTime();
		if (counter) {
			this.manual = counter.manual;
			this.showValue = counter.showValue;
			this.repeatSame = counter.repeatSame;
			this.autoRestart = counter.autoRestart;
			this.notify = counter.notify;
			this.startStopHidden = counter.startStopHidden;
		}
		this.#initialKey = JSON.stringify(this.input);
		this.#initialTimerKey = JSON.stringify(this.input.timer);
	}
}
