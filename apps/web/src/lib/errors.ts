import { ApiError, NetworkError, ServerUnavailableError } from '#lib/http/client.ts';

/**
 * Текст ошибки для показа пользователю.
 * Известные ошибки несут готовый текст: `ApiError` — от сервера, `NetworkError` и
 * `ServerUnavailableError` — про связь.
 * Остальное — неожиданный сбой (баг): пользователю общий текст, подробности — в консоль.
 */
export function errorMessage(error: unknown): string {
	if (error instanceof ApiError || isConnectionError(error)) return error.message;
	console.error(error);
	return 'Что-то пошло не так. Попробуйте ещё раз';
}

/** Ошибка связи (нет интернета, сервер недоступен) — запрос имеет смысл повторить. */
export function isConnectionError(error: unknown): error is NetworkError | ServerUnavailableError {
	return error instanceof NetworkError || error instanceof ServerUnavailableError;
}
