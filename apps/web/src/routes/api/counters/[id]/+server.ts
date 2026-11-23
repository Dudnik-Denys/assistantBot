import { HttpStatus } from '#lib/constants/http-status.ts';
import { handleApi, readJson, requireUser } from '#lib/server/http.ts';
import { counters } from '#lib/server/services.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ locals, params }) =>
	handleApi(async () => Response.json(await counters.get(requireUser(locals).id, params.id)));

export const PUT: RequestHandler = ({ locals, params, request }) =>
	handleApi(async () => {
		const user = requireUser(locals);
		const input = await readJson(request);
		return Response.json(await counters.update(user.id, params.id, input));
	});

export const DELETE: RequestHandler = ({ locals, params }) =>
	handleApi(async () => {
		await counters.remove(requireUser(locals).id, params.id);
		return new Response(null, { status: HttpStatus.NoContent });
	});
