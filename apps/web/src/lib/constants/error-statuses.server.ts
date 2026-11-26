import { InitDataError, NotFoundError, ValidationError } from '@tgab/core';
import { HttpStatus } from '#lib/constants/http-status.ts';
import type { ErrorStatus } from '#lib/server/types.ts';

/**
 * Какие ошибки API отдаёт клиенту и с каким кодом.
 * Используется в `errorResponse`, только на сервере.
 * Доменные ошибки core про HTTP не знают — перевод в коды здесь. Новая ошибка — одна строка.
 * Порядок важен: побеждает первое совпадение (наследник — выше родителя).
 * `HttpStatusError` сюда не входит: его код задаётся у каждого экземпляра. Ошибки разбора
 * (`ZodError`, `SyntaxError`) сюда тоже не входят: ввод разбирают `parseInput` в core и `readJson`,
 * превращая ошибку ввода в `ValidationError`/400; такие же ошибки откуда-то ещё — баг, и он
 * должен стать 500 с записью в лог, а не «некорректными данными».
 */
export const ERROR_STATUSES: readonly ErrorStatus[] = [
	{ type: InitDataError, status: HttpStatus.Unauthorized },
	{ type: NotFoundError, status: HttpStatus.NotFound },
	{ type: ValidationError, status: HttpStatus.BadRequest },
];
