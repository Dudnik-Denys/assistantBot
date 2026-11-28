import { autoRetry } from '@grammyjs/auto-retry';
import type { UsersService } from '@tgab/core';
import { Bot } from 'grammy';
import { type BotContext, hasUser } from '#bot/context.ts';
import { handleBotError } from '#bot/errors.ts';
import { createAllowlist } from '#bot/middlewares/allowlist.ts';
import { logApiCalls, logUpdates } from '#bot/middlewares/logging.ts';
import type { RouterDeps } from '#bot/routers/deps.ts';
import { createPrivateRouter, publicRouter } from '#bot/routers/index.ts';

export interface BotDeps extends RouterDeps {
	token: string;
	users: UsersService;
}

/**
 * Собирает бота: middleware и роутеры в нужном порядке. Не запускает его — это делает index.ts.
 * Порядок важен: лог → публичные команды → allowlist → команды для своих.
 */
export function createBot(deps: BotDeps): Bot<BotContext> {
	const bot = new Bot<BotContext>(deps.token);

	bot.api.config.use(autoRetry());
	bot.api.config.use(logApiCalls);

	bot.use(logUpdates);
	bot.use(publicRouter);
	bot.use(createAllowlist(deps.users));
	bot.filter(hasUser, createPrivateRouter(deps));

	bot.catch(handleBotError);
	return bot;
}
