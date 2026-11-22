import { ApiError, NetworkError } from '#lib/http/client.ts';

/**
 * Текст ошибки для показа пользователю.
 * Известные ошибки несут готовый текст: `ApiError` — от сервера, `NetworkError` — про связь.
 * Остальное — неожиданный сбой (баг): пользователю общий текст, подробности — в консоль.
 */
export function errorMessage(e: unknown): string {
	if (e instanceof ApiError || e instanceof NetworkError) return e.message;
	console.error(e);
	return 'Что-то пошло не так. Попробуйте ещё раз';
}
