import { handleApi, requireUser } from '#lib/server/http.ts';
import { users } from '#lib/server/services.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ locals }) =>
	handleApi(async () => Response.json(await users.getProfile(requireUser(locals).id)));
