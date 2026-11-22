import { toUserDto } from '@tgab/core';
import { handleApi, requireUser } from '#lib/server/http.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ locals }) =>
	handleApi(async () => Response.json(toUserDto(requireUser(locals))));
