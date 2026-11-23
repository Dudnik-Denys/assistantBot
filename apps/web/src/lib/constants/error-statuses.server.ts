import { InitDataError, NotFoundError } from '@tgab/core';
import { z } from 'zod';
import { HttpStatus } from '#lib/constants/http-status.ts';

/** Класс ошибки — то, с чем работает `instanceof`. */
type ErrorClass<E extends Error> = abstract new (...args: never[]) => E;

/** Соответствие «класс ошибки → HTTP-код и текст ответа». */
export interface ErrorStatus<E extends Error = Error> {
	type: ErrorClass<E>;
	status: number;
	/** Текст ответа, если `error.message` не подходит. */
	message?(error: E): string;
}

/** Помощник для типов: внутри `message` ошибка имеет тип своего класса (`e.issues` у ZodError). */
const errorStatus = <E extends Error>(entry: ErrorStatus<E>): ErrorStatus<E> => entry;

/**
 * Какие ошибки API отдаёт клиенту и с каким кодом.
 * Используется в `errorResponse`, только на сервере.
 * Доменные ошибки core про HTTP не знают — перевод в коды здесь. Новая ошибка — одна строка.
 * Порядок важен: побеждает первое совпадение (наследник — выше родителя).
 * `HttpStatusError` сюда не входит: его код задаётся у каждого экземпляра.
 */
export const ERROR_STATUSES: readonly ErrorStatus[] = [
	errorStatus({ type: InitDataError, status: HttpStatus.Unauthorized }),
	errorStatus({ type: NotFoundError, status: HttpStatus.NotFound }),
	errorStatus({
		type: z.ZodError,
		status: HttpStatus.BadRequest,
		message: (zodError) => zodError.issues[0]?.message ?? 'Некорректные данные',
	}),
	errorStatus({
		type: SyntaxError,
		status: HttpStatus.BadRequest,
		message: () => 'Некорректный JSON',
	}),
];
