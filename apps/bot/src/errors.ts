import { type BotError, GrammyError, HttpError } from 'grammy';
import type { BotContext } from '#bot/context.ts';

/** Единый обработчик ошибок (`bot.catch`): различает ошибки Telegram, сети и остальные. */
export function handleBotError({ error, ctx }: BotError<BotContext>): void {
	const where = `update ${ctx.update.update_id}`;
	if (error instanceof GrammyError)
		console.error(`Telegram API error (${where}):`, error.description);
	else if (error instanceof HttpError) console.error(`Network error (${where}):`, error.error);
	else console.error(`Error (${where}):`, error);
}
