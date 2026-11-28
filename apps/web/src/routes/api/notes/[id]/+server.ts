import { recordAction, recordDelete, recordUpdate } from '#lib/server/http.ts';
import { notes } from '#lib/server/services.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = recordAction((userId, id) => notes.get(userId, id));

export const PUT: RequestHandler = recordUpdate((userId, id, input) =>
	notes.update(userId, id, input),
);

export const DELETE: RequestHandler = recordDelete((userId, id) => notes.remove(userId, id));
