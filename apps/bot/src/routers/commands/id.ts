import { Composer } from 'grammy';
import { BotCommand } from '#bot/constants/commands.ts';
import type { BotContext } from '#bot/context.ts';

/**
 * /id — свой telegramId, чтобы попросить доступ. Доступна всем, поэтому подключается до allowlist.
 */
export const idRouter = new Composer<BotContext>();

idRouter.command(BotCommand.Id, (ctx) =>
	ctx.reply(`Ваш Telegram ID: <code>${ctx.from?.id}</code>`, { parse_mode: 'HTML' }),
);
