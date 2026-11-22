import { DatabaseUrlSchema, optionalEnv, TelegramIdSchema } from '@tgab/core/env';
import { z } from 'zod';

const EnvSchema = z.object({
	BOT_TOKEN: z.string().min(1),
	DATABASE_URL: DatabaseUrlSchema,
	/** Автор: при первом входе становится админом. */
	ADMIN_TELEGRAM_ID: optionalEnv(TelegramIdSchema),
	/** HTTPS-адрес Mini App; если задан, /start показывает кнопку открытия. */
	MINI_APP_URL: optionalEnv(z.url({ protocol: /^https$/ })),
});

/** Переменные окружения бота; при ошибке бот не стартует и перечисляет все проблемы сразу. */
export const env = parseEnv();

function parseEnv(): z.infer<typeof EnvSchema> {
	const result = EnvSchema.safeParse(process.env);
	if (!result.success) {
		throw new Error(
			`Некорректные переменные окружения (см. README, «Переменные окружения»):\n${z.prettifyError(result.error)}`,
		);
	}
	return result.data;
}
