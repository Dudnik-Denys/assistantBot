import { api } from '#lib/api.ts';
import { loadItem } from '#lib/load-item.ts';
import type { PageLoad } from './$types';

/** Заметка загружается до показа страницы. */
export const load: PageLoad = async ({ params, fetch }) => ({
	note: await loadItem(
		() => api.notes.get(params.id, fetch),
		'Возможно, ссылка устарела или заметку удалили',
	),
});
