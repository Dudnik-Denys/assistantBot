import { z } from 'zod';
import { NotFoundError } from '../errors.ts';

/** id записи в БД: UUID (модели используют `uuid(7)`). */
export const IdSchema = z.uuid();

/**
 * id не в формате UUID → `NotFoundError(notFoundMessage)` до запроса в БД:
 * Postgres отверг бы такую строку для колонки `uuid` ошибкой, а не пустым результатом.
 */
export function assertId(id: string, notFoundMessage: string): void {
	if (!IdSchema.safeParse(id).success) throw new NotFoundError(notFoundMessage);
}
