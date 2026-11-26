import { recordAction } from '#lib/server/http.ts';
import { notifications } from '#lib/server/services.ts';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = recordAction((userId, id) =>
	notifications.markRead(userId, id),
);
