import { createUsersService } from '@tgab/core';
import { createPrismaClient } from '@tgab/db';
import { createBot } from '#bot/bot.ts';
import { COMMAND_MENU } from '#bot/constants/commands.ts';
import { env } from '#bot/env.ts';

const db = createPrismaClient(env.DATABASE_URL);
const users = createUsersService(db, { adminTelegramId: env.ADMIN_TELEGRAM_ID });
const bot = createBot({ token: env.BOT_TOKEN, users, miniAppUrl: env.MINI_APP_URL });

await bot.api.setMyCommands(COMMAND_MENU);

// Long polling: допускается только один запущенный экземпляр на токен.
const shutdown = async () => {
	await bot.stop();
	await db.$disconnect();
};
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);

await bot.start({
	drop_pending_updates: true,
	onStart: (me) => console.log(`Бот @${me.username} запущен (long polling)`),
});
