import { z } from 'zod';
import { DatabaseUrlSchema, TelegramIdSchema } from './variables.ts';

/** Переменные окружения скрипта `user:allow`. */
export const AllowUserEnvSchema = z.object({ DATABASE_URL: DatabaseUrlSchema });

/** Аргументы `user:allow <telegramId> [--admin]`. */
export const AllowUserArgsSchema = z.object({
	telegramId: TelegramIdSchema,
	admin: z.boolean(),
});
