import {
	COUNTER_DEFAULT_TIME,
	COUNTER_DURATION_REQUIRED_MESSAGE,
	COUNTER_EMPTY_DURATION,
	COUNTER_TARGET_PASSED_MESSAGE,
	COUNTER_TIMER_MODE,
	COUNTER_TITLE_REQUIRED_MESSAGE,
} from '@tgab/core/constants/counters';
import { MS_PER_DAY } from '@tgab/core/constants/time';
import type { CounterDto, CounterInput } from '#lib/api.ts';
import { COUNTER_NO_TIMER, type CounterTimerModeOption } from '#lib/constants/counters.ts';
import { todayAt, toLocalDateTime } from '#lib/utils/dates.ts';

/** Локальные `2026-11-24T12:00` → дата и время по отдельности (поля формы). */
function splitLocal(local: string): { date: string; time: string } {
	const [date = '', time = COUNTER_DEFAULT_TIME] = local.split('T');
	return { date, time };
}

/**
 * Состояние формы счётчика: поля, ввод для API (`input`), есть ли изменения (`dirty`) и что
 * мешает сохранить (`problem`). Даты — в часовом поясе пользователя; по умолчанию старт —
 * сегодня, окончание — завтра, оба в `COUNTER_DEFAULT_TIME` (12:00).
 *
 * Создавать в <script> формы: `const form = new CounterFormState(counter, api.user.timeZone)`,
 * поля — `bind:value={form.title}`.
 */
export class CounterFormState {
	/** Сегодня в поясе пользователя (`2026-11-24`) — раньше дату окончания выбрать нельзя. */
	readonly today: string;
	readonly #nowLocal: string;
	readonly #initialKey: string;

	title = $state('');
	mode = $state<CounterTimerModeOption>(COUNTER_NO_TIMER);
	startDate = $state('');
	startTime = $state('');
	duration = $state({ ...COUNTER_EMPTY_DURATION });
	targetDate = $state('');
	targetTime = $state('');
	manual = $state(true);
	showValue = $state(true);
	repeatSame = $state(false);
	autoRestart = $state(false);
	notify = $state(true);

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
						startAt: `${this.startDate}T${this.startTime}`,
						duration: this.duration,
					}
				: this.mode === COUNTER_TIMER_MODE.Date
					? { mode: this.mode, targetAt: `${this.targetDate}T${this.targetTime}` }
					: null,
		repeatSame: this.repeatSame,
		autoRestart: this.repeatSame && this.autoRestart,
		notify: this.notify,
	}));

	/** Почему нельзя сохранить (те же тексты, что у сервера) или null. */
	problem = $derived.by(() => {
		if (!this.title.trim()) return COUNTER_TITLE_REQUIRED_MESSAGE;
		const durationEmpty = Object.values(this.duration).every((part) => !part);
		if (this.mode === COUNTER_TIMER_MODE.Duration && durationEmpty)
			return COUNTER_DURATION_REQUIRED_MESSAGE;
		// Строки одного формата сравниваются как даты.
		const targetLocal = `${this.targetDate}T${this.targetTime}`;
		if (this.mode === COUNTER_TIMER_MODE.Date && targetLocal <= this.#nowLocal)
			return COUNTER_TARGET_PASSED_MESSAGE;
		return null;
	});

	/** Есть несохранённые изменения (реактивно: `input` — `$derived`). */
	get dirty(): boolean {
		return JSON.stringify(this.input) !== this.#initialKey;
	}

	/** counter — счётчик для изменения; нет — новый. */
	constructor(counter: CounterDto | undefined, timeZone: string, now = new Date()) {
		this.#nowLocal = toLocalDateTime(now, timeZone);
		this.today = splitLocal(this.#nowLocal).date;

		const timer = counter?.timer;
		const start = splitLocal(
			timer?.mode === COUNTER_TIMER_MODE.Duration
				? toLocalDateTime(timer.startAt, timeZone)
				: todayAt(COUNTER_DEFAULT_TIME, timeZone, now),
		);
		const target = splitLocal(
			timer?.mode === COUNTER_TIMER_MODE.Date
				? toLocalDateTime(timer.targetAt, timeZone)
				: todayAt(COUNTER_DEFAULT_TIME, timeZone, new Date(now.getTime() + MS_PER_DAY)),
		);

		this.title = counter?.title ?? '';
		this.mode = timer?.mode ?? COUNTER_NO_TIMER;
		this.startDate = start.date;
		this.startTime = start.time;
		this.duration = { ...(timer?.duration ?? COUNTER_EMPTY_DURATION) };
		this.targetDate = target.date;
		this.targetTime = target.time;
		if (counter) {
			this.manual = counter.manual;
			this.showValue = counter.showValue;
			this.repeatSame = counter.repeatSame;
			this.autoRestart = counter.autoRestart;
			this.notify = counter.notify;
		}
		this.#initialKey = JSON.stringify(this.input);
	}
}
