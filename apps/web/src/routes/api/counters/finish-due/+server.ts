import { handleApi, requireUser } from '#lib/server/http.ts';
import { counters } from '#lib/server/services.ts';
import type { RequestHandler } from './$types';

/** Завершить все наступившие циклы пользователя (список счётчиков); ответ — изменённые. */
export const POST: RequestHandler = ({ locals }) =>
	handleApi(async () => Response.json(await counters.finishDueOf(requireUser(locals).id)));
