import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test';
import { UNEXPECTED_ERROR_MESSAGE } from '#web/lib/constants/errors.ts';
import { HttpStatus } from '#web/lib/constants/http-status.ts';
import { errorMessage, isConnectionError } from '#web/lib/errors.ts';
import { ApiError, NetworkError, ServerUnavailableError } from '#web/lib/http/client.ts';

const SERVER_MESSAGE = 'Заметка не найдена';

describe('isConnectionError', () => {
	test('Тест признания ошибкой связи отсутствия ответа и ответа не от нашего API', () => {
		expect(isConnectionError(new NetworkError(new TypeError('Failed to fetch')))).toBe(true);
		expect(isConnectionError(new ServerUnavailableError(HttpStatus.NotFound))).toBe(true);
	});

	test('Тест отказа считать ошибкой связи ответ нашего API и прочие ошибки', () => {
		expect(isConnectionError(new ApiError(HttpStatus.NotFound, SERVER_MESSAGE))).toBe(false);
		expect(isConnectionError(new Error('Сбой'))).toBe(false);
		expect(isConnectionError('строка')).toBe(false);
	});
});

describe('errorMessage', () => {
	let consoleError: ReturnType<typeof spyOn>;

	beforeEach(() => {
		// Неожиданные ошибки пишутся в консоль — в тестах это шум, но факт записи проверяется.
		consoleError = spyOn(console, 'error').mockImplementation(() => {});
	});

	afterEach(() => consoleError.mockRestore());

	test('Тест текста сервера для ошибки нашего API', () => {
		expect(errorMessage(new ApiError(HttpStatus.NotFound, SERVER_MESSAGE))).toBe(SERVER_MESSAGE);
	});

	test('Тест текста про связь для ошибок связи', () => {
		const networkError = new NetworkError(new TypeError('Failed to fetch'));
		const unavailable = new ServerUnavailableError(HttpStatus.NotFound);
		expect(errorMessage(networkError)).toBe(networkError.message);
		expect(errorMessage(unavailable)).toBe(unavailable.message);
		expect(consoleError).not.toHaveBeenCalled();
	});

	test('Тест общего текста и записи в консоль для неожиданной ошибки', () => {
		const unexpected = new Error('undefined is not a function');
		expect(errorMessage(unexpected)).toBe(UNEXPECTED_ERROR_MESSAGE);
		expect(consoleError).toHaveBeenCalledWith(unexpected);
	});
});
