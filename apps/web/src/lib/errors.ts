import { ApiError, NetworkError, ServerUnavailableError } from '#lib/http/client.ts';

/**
 * Текст ошибки для показа пользователю.
 * Известные ошибки несут готовый текст: `ApiError` — от сервера, `NetworkError` и
 * `ServerUnavailableError` — про связь.
 * Остальное — неожиданный сбой (баг): пользователю общий текст, подробности — в консоль.
 */
export function errorMessage(e: unknown): string {
	if (e instanceof ApiError || isConnectionError(e)) return e.message;
	console.error(e);
	return 'Что-то пошло не так. Попробуйте ещё раз';
}

/** Ошибка связи (нет интернета, сервер недоступен) — запрос имеет смысл повторить. */
export function isConnectionError(e: unknown): e is NetworkError | ServerUnavailableError {
	return e instanceof NetworkError || e instanceof ServerUnavailableError;
}
