import { json } from '@sveltejs/kit';
import { handleApi, requireUser } from '#lib/server/http.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ locals }) =>
	handleApi(async () => {
		const user = requireUser(locals);
		return json({
			id: user.id,
			telegramId: user.telegramId.toString(),
			firstName: user.firstName,
			isAdmin: user.isAdmin,
			timezone: user.timezone
		});
	});
