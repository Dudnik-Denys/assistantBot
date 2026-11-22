import { HttpStatus } from '#lib/constants/http-status.ts';
import type { __Entity__Input } from '@tgab/core';
import { handleApi, readJson, requireUser } from '#lib/server/http.ts';
import { __entities__ } from '#lib/server/services.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ locals, url }) =>
	handleApi(async () => {
		const user = requireUser(locals);
		const list = await __entities__.list(user.id, {
			q: url.searchParams.get('q') ?? undefined,
			limit: url.searchParams.get('limit') ?? undefined,
		});
		return Response.json(list);
	});

export const POST: RequestHandler = ({ locals, request }) =>
	handleApi(async () => {
		const user = requireUser(locals);
		const created = await __entities__.create(user.id, (await readJson(request)) as __Entity__Input);
		return Response.json(created, { status: HttpStatus.Created });
	});
