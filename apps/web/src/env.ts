import { defineEnvVars } from '@sveltejs/kit/env';

const optional = (value: string | undefined) => (value ? value : undefined);
const telegramId = (value: string | undefined) => {
	if (!value) return undefined;
	if (!/^\d+$/.test(value)) throw new Error('ожидается числовой telegramId');
	return BigInt(value);
};

export const variables = defineEnvVars({
	DATABASE_URL: { description: 'Строка подключения к Postgres' },
	BOT_TOKEN: {
		schema: optional,
		description: 'Токен бота: им проверяется подпись initData Mini App'
	},
	ADMIN_TELEGRAM_ID: {
		schema: telegramId,
		description: 'telegramId автора; создаётся как админ при первом входе'
	},
	DEV_TELEGRAM_ID: {
		schema: telegramId,
		description: 'Только в dev: вход из обычного браузера от имени этого telegramId'
	}
});
