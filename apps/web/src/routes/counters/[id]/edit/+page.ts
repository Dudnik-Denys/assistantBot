import { api } from '#lib/api.ts';
import { loadItem } from '#lib/load-item.ts';
import type { PageLoad } from './$types';

/** Настройки счётчика: сам счётчик загружается до показа формы. */
export const load: PageLoad = async ({ params, fetch }) => ({
	counter: await loadItem(
		() => api.counters.get(params.id, fetch),
		'Возможно, ссылка устарела или счётчик удалили',
	),
});
