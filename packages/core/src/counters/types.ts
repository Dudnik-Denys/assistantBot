export type { CounterDto } from '../schemas/counters/counter-dto.ts';

/** Итог одного прохода `processDue` (воркер). */
export interface ProcessDueResult {
	/** Сколько наступивших счётчиков выбрано (не больше `COUNTER_DUE_BATCH_SIZE`). */
	selected: number;
	/** Сколько из них завершено; остальные заняты другим процессом (`SKIP LOCKED`) или упали. */
	finished: number;
	/** Счётчики, окончание которых упало с ошибкой: их возьмёт следующий проход. */
	failed: { id: string; error: unknown }[];
}
