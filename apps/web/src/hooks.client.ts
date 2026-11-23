import type { HandleClientError } from '@sveltejs/kit/hooks';
import { HttpStatus } from '#lib/constants/http-status.ts';

/**
 * Ошибки в браузере перед показом routes/+error.svelte. Свои ошибки (`error(...)` в load,
 * `kind: 'app'`) проходят как есть. Ошибки SvelteKit и неожиданные сбои (не загрузился код
 * страницы без интернета, ошибка рендера) — без технического текста («Internal Error»,
 * «Not Found»); подробности сбоя — в консоль.
 */
export const handleError: HandleClientError = ({ kind, error }) => {
	if (kind === 'app') return;
	if (kind === 'framework' && error.status === HttpStatus.NotFound) {
		return {
			title: 'Страница не найдена',
			message: 'Возможно, ссылка устарела или страницу удалили',
		};
	}
	console.error(error);
	return { message: '' };
};
