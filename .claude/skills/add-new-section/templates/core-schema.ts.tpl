import { z } from 'zod';
import { __ENTITY___TITLE_MAX } from './limits.ts';

export { __ENTITY___TITLE_MAX };

export const __entity__InputSchema = z.object({
	title: z
		.string()
		.trim()
		.min(1, 'Название не может быть пустым')
		.max(__ENTITY___TITLE_MAX),
});

export type __Entity__Input = z.input<typeof __entity__InputSchema>;

export const __entity__ListQuerySchema = z.object({
	q: z.string().trim().max(200).optional(),
	limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type __Entity__ListQuery = z.input<typeof __entity__ListQuerySchema>;

/** __Title__ в ответе API: даты — ISO-строки. */
export interface __Entity__Dto {
	id: string;
	title: string;
	createdAt: string;
	updatedAt: string;
}
