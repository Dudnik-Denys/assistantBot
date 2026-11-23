import { type Handle, sequence } from '@sveltejs/kit/hooks';
import { authenticateRequest } from '#lib/server/auth.ts';
import { errorResponse } from '#lib/server/http.ts';

/**
 * Запрет индексации для всех ответов (страницы и API): приложение закрытое.
 * В отличие от robots.txt, заголовок не даёт поисковику показать адрес в выдаче,
 * даже если на него где-то есть ссылка.
 */
const noIndex: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);
	response.headers.set('X-Robots-Tag', 'noindex, nofollow');
	return response;
};

/**
 * Запросы к `/api/*` пускаются только от пользователей из allowlist (`authenticateRequest`):
 * пользователь кладётся в `locals.user`, иначе — ответ с ошибкой (401/403). Страницы не трогаем.
 */
const authorizeApi: Handle = async ({ event, resolve }) => {
	event.locals.user = null;
	if (!event.url.pathname.startsWith('/api/')) return resolve(event);
	try {
		event.locals.user = await authenticateRequest(event.request);
	} catch (error) {
		return errorResponse(error);
	}
	return resolve(event);
};

export const handle = sequence(noIndex, authorizeApi);
