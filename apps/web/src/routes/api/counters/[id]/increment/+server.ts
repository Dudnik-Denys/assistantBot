import { handleApi, requireUser } from '#lib/server/http.ts';
import { counters } from '#lib/server/services.ts';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ locals, params }) =>
	handleApi(async () => Response.json(await counters.increment(requireUser(locals).id, params.id)));
