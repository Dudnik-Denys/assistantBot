import { api } from '#lib/api.ts';
import { COUNTER_DEPENDENCY } from '#lib/constants/counters.ts';
import { loadItem } from '#lib/load-item.ts';
import type { PageLoad } from './$types';

/** Счётчик загружается до показа страницы; `invalidate(COUNTER_DEPENDENCY)` — перезапрос. */
export const load: PageLoad = async ({ params, fetch, depends }) => {
	depends(COUNTER_DEPENDENCY);
	return {
		counter: await loadItem(
			() => api.counters.get(params.id, fetch),
			'Возможно, ссылка устарела или счётчик удалили',
		),
	};
};
