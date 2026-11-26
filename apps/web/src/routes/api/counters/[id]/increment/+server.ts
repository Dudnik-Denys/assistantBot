import { recordAction } from '#lib/server/http.ts';
import { counters } from '#lib/server/services.ts';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = recordAction((userId, id) => counters.increment(userId, id));
