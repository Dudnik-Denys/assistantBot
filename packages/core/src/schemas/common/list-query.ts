import { z } from 'zod';
import { LIST_LIMIT_DEFAULT, LIST_LIMIT_MAX, SEARCH_QUERY_MAX } from '../../constants/list.ts';

/**
 * Параметры запроса списка любого модуля: поиск `q` и `limit` (из query-строки — числом-строкой).
 */
export const ListQuerySchema = z.object({
	q: z.string().trim().max(SEARCH_QUERY_MAX).optional(),
	limit: z.coerce.number().int().min(1).max(LIST_LIMIT_MAX).default(LIST_LIMIT_DEFAULT),
});
