import { ApiError, NetworkError, ServerUnavailableError } from '#lib/http/client.ts';

/** Текст для пользователя при неожиданной ошибке (баге) — подробности только в консоли. */
export const UNEXPECTED_ERROR_MESSAGE = 'Что-то пошло не так. Попробуйте ещё раз';

/**
 * Текст ошибки для показа пользователю.
 * Известные ошибки несут готовый текст: `ApiError` — от сервера, `NetworkError` и
 * `ServerUnavailableError` — про связь.
 * Остальное — неожиданный сбой (баг): пользователю общий текст, подробности — в консоль.
 */
export function errorMessage(error: unknown): string {
	if (error instanceof ApiError || isConnectionError(error)) return error.message;
	console.error(error);
	return UNEXPECTED_ERROR_MESSAGE;
}

/** Ошибка связи (нет интернета, сервер недоступен) — запрос имеет смысл повторить. */
export function isConnectionError(error: unknown): error is NetworkError | ServerUnavailableError {
	return error instanceof NetworkError || error instanceof ServerUnavailableError;
}
