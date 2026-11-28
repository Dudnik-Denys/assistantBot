import { handleApi, requireUser } from '#lib/server/http.ts';
import { counters } from '#lib/server/services.ts';
import type { RequestHandler } from './$types';

/**
 * Завершить все наступившие циклы пользователя (список счётчиков); ответ — изменённые.
 * Упавшие — в лог сервера: клиент повторит запрос, а сбойный счётчик не мешает остальным.
 */
export const POST: RequestHandler = ({ locals }) =>
	handleApi(async () => {
		const { counters: finished, failed } = await counters.finishDueOf(requireUser(locals).id);
		for (const { id, error } of failed) {
			console.error(`Окончание цикла счётчика ${id} не обработано:`, error);
		}
		return Response.json(finished);
	});
