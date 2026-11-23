import { HttpStatus } from '#lib/constants/http-status.ts';
import { handleApi, readJson, requireUser } from '#lib/server/http.ts';
import { counters } from '#lib/server/services.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ locals }) =>
	handleApi(async () => Response.json(await counters.list(requireUser(locals).id)));

export const POST: RequestHandler = ({ locals, request }) =>
	handleApi(async () => {
		const user = requireUser(locals);
		const created = await counters.create(user.id, await readJson(request));
		return Response.json(created, { status: HttpStatus.Created });
	});
