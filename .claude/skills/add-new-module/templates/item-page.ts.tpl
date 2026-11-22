import { HttpStatus } from '#lib/constants/http-status.ts';
import { error } from '@sveltejs/kit';
import { ApiError, api } from '#lib/api.ts';
import { errorMessage } from '#lib/errors.ts';
import type { PageLoad } from './$types';

/** Запись загружается до показа страницы; ошибка — в routes/+error.svelte. */
export const load: PageLoad = async ({ params, fetch }) => {
	try {
		return { __entity__: await api.__entities__.get(params.id, fetch) };
	} catch (e) {
		error(e instanceof ApiError ? e.status : HttpStatus.InternalServerError, errorMessage(e));
	}
};
