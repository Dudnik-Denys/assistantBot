import { error } from '@sveltejs/kit';
import { ApiError, api } from '#lib/api.ts';
import { HttpStatus } from '#lib/constants/http-status.ts';
import { errorMessage } from '#lib/errors.ts';
import type { PageLoad } from './$types';

/** Заметка загружается до показа страницы; ошибка — в routes/+error.svelte. */
export const load: PageLoad = async ({ params, fetch }) => {
	try {
		return { note: await api.notes.get(params.id, fetch) };
	} catch (e) {
		if (e instanceof ApiError && e.status === HttpStatus.NotFound) {
			error(HttpStatus.NotFound, {
				title: e.message,
				message: 'Возможно, ссылка устарела или заметку удалили',
			});
		}
		error(e instanceof ApiError ? e.status : HttpStatus.InternalServerError, errorMessage(e));
	}
};
