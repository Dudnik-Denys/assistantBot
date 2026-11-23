import { z } from 'zod';

/** Тело ошибки нашего API (`errorResponse` на сервере): `{ error, ...details }`. */
export const ApiErrorBodySchema = z.looseObject({ error: z.string() });
