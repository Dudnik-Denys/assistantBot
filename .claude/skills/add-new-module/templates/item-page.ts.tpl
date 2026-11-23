import { error } from '@sveltejs/kit';
import { ApiError, api } from '#lib/api.ts';
import { HttpStatus } from '#lib/constants/http-status.ts';
import { errorMessage } from '#lib/errors.ts';
import type { PageLoad } from './$types';

/** Запись загружается до показа страницы; ошибка — в routes/+error.svelte. */
export const load: PageLoad = async ({ params, fetch }) => {
	try {
		return { __entity__: await api.__entities__.get(params.id, fetch) };
	} catch (loadError) {
		// 404: заголовок — текст сервера («Счётчик не
		// найден»), под ним — подсказка, подпись «404 Error».
		if (loadError instanceof ApiError && loadError.status === HttpStatus.NotFound) {
			error(HttpStatus.NotFound, 'Возможно, ссылка устарела или __one__ удалили', {
				title: loadError.message,
			});
		}
		const status =
			loadError instanceof ApiError ? loadError.status : HttpStatus.InternalServerError;
		error(status, errorMessage(loadError));
	}
};
