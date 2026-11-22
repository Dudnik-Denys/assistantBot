import type { NoteInput } from '@tgab/core';
import { HttpStatus } from '#lib/constants/http-status.ts';
import { handleApi, readJson, requireUser } from '#lib/server/http.ts';
import { notes } from '#lib/server/services.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ locals, params }) =>
	handleApi(async () => Response.json(await notes.get(requireUser(locals).id, params.id)));

export const PUT: RequestHandler = ({ locals, params, request }) =>
	handleApi(async () => {
		const user = requireUser(locals);
		const note = await notes.update(user.id, params.id, (await readJson(request)) as NoteInput);
		return Response.json(note);
	});

export const DELETE: RequestHandler = ({ locals, params }) =>
	handleApi(async () => {
		await notes.remove(requireUser(locals).id, params.id);
		return new Response(null, { status: HttpStatus.NoContent });
	});
