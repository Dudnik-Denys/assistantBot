import { api } from '#lib/api.ts';
import { loadItem } from '#lib/load-item.ts';
import type { PageLoad } from './$types';

/**
 * Запись загружается до показа страницы. Ошибки — в routes/+error.svelte через `loadItem`:
 * 404 — заголовок от сервера («__Entity__ не найден») и подсказка ниже, остальное — по статусу.
 */
export const load: PageLoad = async ({ params, fetch }) => ({
	__entity__: await loadItem(
		() => api.__entities__.get(params.id, fetch),
		'Возможно, ссылка устарела или __one__ удалили',
	),
});
