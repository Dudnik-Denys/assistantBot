import { api } from '#lib/api.ts';
import { loadItem } from '#lib/load-item.ts';
import type { PageLoad } from './$types';

/**
 * Уведомление загружается до показа страницы. Прочитанным оно отмечается только на экране
 * (`NotificationView`): `load` выполняется и при предзагрузке ссылки — по наведению.
 */
export const load: PageLoad = async ({ params, fetch }) => ({
	notification: await loadItem(
		() => api.notifications.get(params.id, fetch),
		'Возможно, уведомление или его счётчик удалили',
	),
});
