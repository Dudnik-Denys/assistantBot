import {
	BotTokenSchema,
	DatabaseUrlSchema,
	MiniAppUrlSchema,
	optionalEnv,
	TelegramIdSchema,
} from '@tgab/core/env';
import { z } from 'zod';

/** Переменные окружения бота. Разбор и сообщение об ошибке — в `env.ts`. */
export const EnvSchema = z.object({
	BOT_TOKEN: BotTokenSchema,
	DATABASE_URL: DatabaseUrlSchema,
	/** Автор: при первом входе становится админом. */
	ADMIN_TELEGRAM_ID: optionalEnv(TelegramIdSchema),
	/** HTTPS-адрес Mini App; если задан, /start показывает кнопку открытия. */
	MINI_APP_URL: optionalEnv(MiniAppUrlSchema),
});
