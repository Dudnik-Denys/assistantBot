import { HttpStatus } from '#lib/constants/http-status.ts';
import { handleApi, readJson, requireUser } from '#lib/server/http.ts';
import { notes } from '#lib/server/services.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ locals, url }) =>
	handleApi(async () => {
		const user = requireUser(locals);
		const list = await notes.list(user.id, {
			q: url.searchParams.get('q') ?? undefined,
			limit: url.searchParams.get('limit') ?? undefined,
		});
		return Response.json(list);
	});

export const POST: RequestHandler = ({ locals, request }) =>
	handleApi(async () => {
		const user = requireUser(locals);
		const note = await notes.create(user.id, await readJson(request));
		return Response.json(note, { status: HttpStatus.Created });
	});
