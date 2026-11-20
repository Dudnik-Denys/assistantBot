import { json } from '@sveltejs/kit';
import type { NoteInput } from '@tgab/core';
import { handleApi, readJson, requireUser } from '#lib/server/http.ts';
import { notes } from '#lib/server/services.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ locals, params }) =>
	handleApi(async () => json(await notes.get(requireUser(locals).id, params.id)));

export const PUT: RequestHandler = ({ locals, params, request }) =>
	handleApi(async () => {
		const user = requireUser(locals);
		const note = await notes.update(user.id, params.id, (await readJson(request)) as NoteInput);
		return json(note);
	});

export const DELETE: RequestHandler = ({ locals, params }) =>
	handleApi(async () => {
		await notes.remove(requireUser(locals).id, params.id);
		return new Response(null, { status: 204 });
	});
