import { collectionCreate, handleApi, requireUser } from '#lib/server/http.ts';
import { counters } from '#lib/server/services.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ locals }) =>
	handleApi(async () => Response.json(await counters.list(requireUser(locals).id)));

export const POST: RequestHandler = collectionCreate((userId, input) =>
	counters.create(userId, input),
);
