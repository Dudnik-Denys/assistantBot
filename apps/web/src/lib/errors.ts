import { UNEXPECTED_ERROR_MESSAGE } from '#lib/constants/errors.ts';
import {
	ApiError,
	NetworkError,
	ResponseFormatError,
	ServerUnavailableError,
} from '#lib/http/client.ts';

/**
 * Текст ошибки для показа пользователю.
 * Известные ошибки несут готовый текст: `ApiError` — от сервера, `NetworkError` и
 * `ServerUnavailableError` — про связь, `ResponseFormatError` — «приложение устарело»
 * (подробности расхождения — в консоль).
 * Остальное — неожиданный сбой (баг): пользователю общий текст, подробности — в консоль.
 */
export function errorMessage(error: unknown): string {
	if (error instanceof ApiError || isConnectionError(error)) return error.message;
	if (error instanceof ResponseFormatError) {
		console.error(`Ответ ${error.path} не по схеме:`, error.cause);
		return error.message;
	}
	console.error(error);
	return UNEXPECTED_ERROR_MESSAGE;
}

/** Ошибка связи (нет интернета, сервер недоступен) — запрос имеет смысл повторить. */
export function isConnectionError(error: unknown): error is NetworkError | ServerUnavailableError {
	return error instanceof NetworkError || error instanceof ServerUnavailableError;
}
