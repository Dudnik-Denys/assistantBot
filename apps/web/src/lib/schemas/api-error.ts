import { z } from 'zod';

/** Тело ошибки нашего API (`errorResponse` на сервере): `{ error, ...details }`. */
export const ApiErrorBodySchema = z.looseObject({ error: z.string() });

/** Дополнительные поля ответа 403 (`authenticateRequest`): свой ID, чтобы попросить доступ. */
export const AccessDeniedBodySchema = z.object({ telegramId: z.string() });
