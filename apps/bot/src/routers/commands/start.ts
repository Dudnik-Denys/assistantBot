import { Composer } from 'grammy';
import { BotCommand } from '#bot/constants/commands.ts';
import type { PrivateContext } from '#bot/context.ts';
import { miniAppKeyboard } from '#bot/keyboards/mini-app.ts';
import type { RouterDeps } from '#bot/routers/deps.ts';

/** /start — приветствие и кнопка Mini App (если задан её адрес). */
export function createStartRouter(deps: Pick<RouterDeps, 'miniAppUrl'>): Composer<PrivateContext> {
	const router = new Composer<PrivateContext>();

	router.command(BotCommand.Start, async (ctx) => {
		const keyboard = deps.miniAppUrl ? miniAppKeyboard(deps.miniAppUrl) : undefined;
		// Без перечня функций: он устаревал бы с каждым новым разделом приложения.
		await ctx.reply(
			'Здравствуйте! Я бот-ассистент для ежедневных дел — всё в приложении.' +
				(keyboard ? '' : '\n\n(MINI_APP_URL не задан — кнопка приложения появится позже.)'),
			{ reply_markup: keyboard },
		);
	});

	return router;
}
