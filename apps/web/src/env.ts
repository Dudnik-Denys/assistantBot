import { defineEnvVars } from '@sveltejs/kit/env';
import { DatabaseUrlSchema, optionalEnv, TelegramIdSchema } from '@tgab/core/env';
import { z } from 'zod';

// schema принимает zod-схемы напрямую (Standard Schema); ошибки показывает SvelteKit при старте.
export const variables = defineEnvVars({
	DATABASE_URL: { schema: DatabaseUrlSchema, description: 'Строка подключения к Postgres' },
	BOT_TOKEN: {
		schema: optionalEnv(z.string()),
		description: 'Токен бота: им проверяется подпись initData Mini App',
	},
	ADMIN_TELEGRAM_ID: {
		schema: optionalEnv(TelegramIdSchema),
		description: 'telegramId автора; создаётся как админ при первом входе',
	},
	DEV_TELEGRAM_ID: {
		schema: optionalEnv(TelegramIdSchema),
		description: 'Только в dev: вход из обычного браузера от имени этого telegramId',
	},
});
