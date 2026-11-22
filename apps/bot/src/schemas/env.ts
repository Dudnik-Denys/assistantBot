import { DatabaseUrlSchema, optionalEnv, TelegramIdSchema } from '@tgab/core/env';
import { z } from 'zod';

/** Переменные окружения бота. Разбор и сообщение об ошибке — в `env.ts`. */
export const EnvSchema = z.object({
	BOT_TOKEN: z.string().min(1),
	DATABASE_URL: DatabaseUrlSchema,
	/** Автор: при первом входе становится админом. */
	ADMIN_TELEGRAM_ID: optionalEnv(TelegramIdSchema),
	/** HTTPS-адрес Mini App; если задан, /start показывает кнопку открытия. */
	MINI_APP_URL: optionalEnv(z.url({ protocol: /^https$/ })),
});

export type Env = z.infer<typeof EnvSchema>;
