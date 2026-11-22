import { z } from 'zod';

/** id записи в БД: UUID (модели используют `uuid(7)`). */
export const IdSchema = z.uuid();
