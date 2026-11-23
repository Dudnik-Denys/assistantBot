import { ApiError, api } from '#lib/api.ts';
import { HttpStatus } from '#lib/constants/http-status.ts';
import { errorMessage } from '#lib/errors.ts';
import type { LayoutLoad } from './$types';

// Все данные доступны только с initData из Telegram, которые есть лишь в браузере,
// поэтому Mini App работает как SPA. Серверная часть SvelteKit — это API (/api/*).
export const ssr = false;

type Access =
	| { kind: 'ready' }
	| { kind: 'denied'; telegramId?: string }
	| { kind: 'error'; message: string };

/**
 * Проверка доступа до показа любой страницы. Ошибки не бросаются, а возвращаются как состояние:
 * ошибка в load корневого layout не попадает в +error.svelte (тот рендерится внутри layout).
 */
export const load: LayoutLoad = async ({ fetch }): Promise<{ access: Access }> => {
	try {
		await api.user.get(fetch);
		return { access: { kind: 'ready' } };
	} catch (loadError) {
		if (loadError instanceof ApiError && loadError.status === HttpStatus.Forbidden) {
			const id = loadError.body.telegramId;
			return { access: { kind: 'denied', telegramId: typeof id === 'string' ? id : undefined } };
		}
		return { access: { kind: 'error', message: errorMessage(loadError) } };
	}
};
