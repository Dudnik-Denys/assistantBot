import { error } from '@sveltejs/kit';
import { ApiError } from '#lib/api.ts';
import { HttpStatus } from '#lib/constants/http-status.ts';
import { errorMessage } from '#lib/errors.ts';

/**
 * Загрузка записи в `load` экрана записи; ошибка — в routes/+error.svelte.
 * 404: заголовок — текст сервера («Счётчик не найден»), под ним — `notFoundHint`,
 * подпись «404 Error». Остальные ошибки — их код и текст для пользователя.
 */
export async function loadItem<T>(request: () => Promise<T>, notFoundHint: string): Promise<T> {
	try {
		return await request();
	} catch (loadError) {
		if (loadError instanceof ApiError && loadError.status === HttpStatus.NotFound) {
			error(HttpStatus.NotFound, notFoundHint, { title: loadError.message });
		}
		error(
			loadError instanceof ApiError ? loadError.status : HttpStatus.InternalServerError,
			errorMessage(loadError),
		);
	}
}
