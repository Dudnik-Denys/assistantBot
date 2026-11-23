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
	/** RUNNING — цикл идёт, FINISHED — закончился и ждёт «Продолжить». */
	status: CounterTimerStatus;
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
	createdAt: string;
	updatedAt: string;
}
