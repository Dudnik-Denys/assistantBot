import type { CounterTimerMode, CounterTimerStatus } from '../constants/counters.ts';
import type { CounterDuration } from '../schemas/counters/counter-input.ts';

/** Таймер счётчика в ответе API: даты — ISO-строки (UTC). */
interface CounterTimerDto {
	mode: CounterTimerMode;
	/** Срок цикла (у режима DATE — нули). */
	duration: CounterDuration;
	/** Начало и конец текущего цикла. */
	startAt: string;
	targetAt: string;
	/** RUNNING — цикл идёт, PAUSED — на паузе, FINISHED — закончился и ждёт «Старт». */
	status: CounterTimerStatus;
	/** Когда поставлен на паузу (только у PAUSED): отсчёт на экране замирает на этом моменте. */
	pausedAt: string | null;
	/** Старт цикла на срок задан вручную; false — старт в момент сохранения настроек. */
	customStart: boolean;
}

/** Счётчик в ответе API: даты — ISO-строки. */
export interface CounterDto {
	id: string;
	title: string;
	value: number;
	/** Показывать кнопки − и + и «Сбросить». */
	manual: boolean;
	/** Показывать число на экране счётчика (при `manual` число видно всегда). */
	showValue: boolean;
	/** null — таймера нет (ручной счётчик). */
	timer: CounterTimerDto | null;
	/** Когда закончился последний цикл; null — ещё ни разу. */
	finishedAt: string | null;
	repeatSame: boolean;
	autoRestart: boolean;
	notify: boolean;
	/** Скрыть кнопки «Старт» и «Стоп» (у таймера на паузе «Старт» видна всегда). */
	startStopHidden: boolean;
	createdAt: string;
	updatedAt: string;
}
