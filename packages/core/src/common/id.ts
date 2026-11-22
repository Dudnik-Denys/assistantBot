import { NotFoundError } from '../errors.ts';
import { IdSchema } from '../schemas/common/id.ts';

/**
 * id не в формате UUID → `NotFoundError(notFoundMessage)` до запроса в БД:
 * Postgres отверг бы такую строку для колонки `uuid` ошибкой, а не пустым результатом.
 */
export function assertId(id: string, notFoundMessage: string): void {
	if (!IdSchema.safeParse(id).success) throw new NotFoundError(notFoundMessage);
}
