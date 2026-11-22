import { z } from 'zod';

/** Сколько записей отдаёт список, если `limit` не указан. */
export const LIST_LIMIT_DEFAULT = 50;
/** Больше записей за один запрос список не отдаёт. */
export const LIST_LIMIT_MAX = 100;
/** Максимальная длина поисковой строки `q`. */
export const SEARCH_QUERY_MAX = 200;

/** Параметры запроса списка любого раздела: поиск `q` и `limit` (из query-строки — числом-строкой). */
export const ListQuerySchema = z.object({
	q: z.string().trim().max(SEARCH_QUERY_MAX).optional(),
	limit: z.coerce.number().int().min(1).max(LIST_LIMIT_MAX).default(LIST_LIMIT_DEFAULT),
});

export type ListQuery = z.input<typeof ListQuerySchema>;
