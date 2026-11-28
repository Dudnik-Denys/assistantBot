import { recordAction, recordDelete } from '#lib/server/http.ts';
import { notifications } from '#lib/server/services.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = recordAction((userId, id) => notifications.get(userId, id));

export const DELETE: RequestHandler = recordDelete((userId, id) =>
	notifications.remove(userId, id),
);
