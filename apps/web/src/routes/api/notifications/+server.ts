import { handleApi, requireUser } from '#lib/server/http.ts';
import { notifications } from '#lib/server/services.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ locals }) =>
	handleApi(async () => Response.json(await notifications.list(requireUser(locals).id)));
