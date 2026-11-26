/** Класс ошибки — то, с чем работает `instanceof`. */
export type ErrorClass<E extends Error> = abstract new (...args: never[]) => E;

/** Соответствие «класс ошибки → HTTP-код и текст ответа» (таблица `ERROR_STATUSES`). */
export interface ErrorStatus<E extends Error = Error> {
	type: ErrorClass<E>;
	status: number;
	/** Текст ответа, если `error.message` не подходит. */
	message?(error: E): string;
}
