import type { CounterDto } from '../schemas/counters/counter-dto.ts';

export type { CounterDto } from '../schemas/counters/counter-dto.ts';

/** Счётчик, окончание цикла которого упало с ошибкой. */
export interface CounterFailure {
	id: string;
	error: unknown;
}

/** Итог `finishDueOf`: завершённые счётчики пользователя и упавшие (их возьмёт следующий вызов). */
export interface FinishDueOfResult {
	counters: CounterDto[];
	failed: CounterFailure[];
}

/** Итог одного прохода `processDue` (воркер). */
export interface ProcessDueResult {
	/** Сколько наступивших счётчиков выбрано (не больше `COUNTER_DUE_BATCH_SIZE`). */
	selected: number;
	/** Сколько из них завершено; остальные заняты другим процессом (`SKIP LOCKED`) или упали. */
	finished: number;
	/** Счётчики, окончание которых упало с ошибкой: их возьмёт следующий проход. */
	failed: CounterFailure[];
}
