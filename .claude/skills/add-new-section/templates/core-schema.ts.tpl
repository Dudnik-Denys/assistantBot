import { z } from 'zod';
import { __ENTITY___TITLE_MAX } from './limits.ts';

export const __Entity__InputSchema = z.object({
	title: z
		.string()
		.trim()
		.min(1, 'Название не может быть пустым')
		.max(__ENTITY___TITLE_MAX),
});

export type __Entity__Input = z.input<typeof __Entity__InputSchema>;

// Запрос списка (`q`, `limit`) — общий `ListQuerySchema` из `../common/list-query.ts`.
// Своя схема — только если разделу нужны доп. параметры: `ListQuerySchema.extend({ … })`.

/** __Title__ в ответе API: даты — ISO-строки. */
export interface __Entity__Dto {
	id: string;
	title: string;
	createdAt: string;
	updatedAt: string;
}
