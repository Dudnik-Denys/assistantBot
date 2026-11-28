import { recordAction, recordDelete, recordUpdate } from '#lib/server/http.ts';
import { counters } from '#lib/server/services.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = recordAction((userId, id) => counters.get(userId, id));

export const PUT: RequestHandler = recordUpdate((userId, id, input) =>
	counters.update(userId, id, input),
);

export const DELETE: RequestHandler = recordDelete((userId, id) => counters.remove(userId, id));
