import { collectionCreate, handleApi, requireUser } from '#lib/server/http.ts';
import { __entities__ } from '#lib/server/services.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ locals, url }) =>
	handleApi(async () => {
		const list = await __entities__.list(requireUser(locals).id, {
			q: url.searchParams.get('q') ?? undefined,
			limit: url.searchParams.get('limit') ?? undefined,
		});
		return Response.json(list);
	});

export const POST: RequestHandler = collectionCreate((userId, input) => __entities__.create(userId, input));
