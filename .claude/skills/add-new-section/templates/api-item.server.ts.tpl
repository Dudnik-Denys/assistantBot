import { HttpStatus } from '#lib/constants/http-status.ts';
import type { __Entity__Input } from '@tgab/core';
import { handleApi, readJson, requireUser } from '#lib/server/http.ts';
import { __entities__ } from '#lib/server/services.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ locals, params }) =>
	handleApi(async () => Response.json(await __entities__.get(requireUser(locals).id, params.id)));

export const PUT: RequestHandler = ({ locals, params, request }) =>
	handleApi(async () => {
		const user = requireUser(locals);
		const input = (await readJson(request)) as __Entity__Input;
		return Response.json(await __entities__.update(user.id, params.id, input));
	});

export const DELETE: RequestHandler = ({ locals, params }) =>
	handleApi(async () => {
		await __entities__.remove(requireUser(locals).id, params.id);
		return new Response(null, { status: HttpStatus.NoContent });
	});
