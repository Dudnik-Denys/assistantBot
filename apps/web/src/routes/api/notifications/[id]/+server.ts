import { HttpStatus } from '#lib/constants/http-status.ts';
import { handleApi, requireUser } from '#lib/server/http.ts';
import { notifications } from '#lib/server/services.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ locals, params }) =>
	handleApi(async () => Response.json(await notifications.get(requireUser(locals).id, params.id)));

export const DELETE: RequestHandler = ({ locals, params }) =>
	handleApi(async () => {
		await notifications.remove(requireUser(locals).id, params.id);
		return new Response(null, { status: HttpStatus.NoContent });
	});
