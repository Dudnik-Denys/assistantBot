import { api } from '#lib/api.ts';
import { loadItem } from '#lib/load-item.ts';
import type { PageLoad } from './$types';

/** Счётчик загружается до показа страницы. */
export const load: PageLoad = async ({ params, fetch }) => ({
	counter: await loadItem(
		() => api.counters.get(params.id, fetch),
		'Возможно, ссылка устарела или счётчик удалили',
	),
});
