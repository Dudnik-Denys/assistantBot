import { recordAction, recordDelete, recordUpdate } from '#lib/server/http.ts';
import { __entities__ } from '#lib/server/services.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = recordAction((userId, id) => __entities__.get(userId, id));

export const PUT: RequestHandler = recordUpdate((userId, id, input) =>
	__entities__.update(userId, id, input),
);

export const DELETE: RequestHandler = recordDelete((userId, id) => __entities__.remove(userId, id));
