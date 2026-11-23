import { Composer } from 'grammy';
import { BotCommand } from '#bot/constants/commands.ts';
import type { BotContext } from '#bot/context.ts';
import { miniAppKeyboard } from '#bot/keyboards/mini-app.ts';
import type { RouterDeps } from '#bot/routers/index.ts';

/** /start — приветствие и кнопка Mini App (если задан её адрес). */
export function createStartRouter(deps: Pick<RouterDeps, 'miniAppUrl'>): Composer<BotContext> {
	const router = new Composer<BotContext>();

	router.command(BotCommand.Start, async (ctx) => {
		const name = ctx.user?.firstName ?? 'привет';
		const keyboard = deps.miniAppUrl ? miniAppKeyboard(deps.miniAppUrl) : undefined;
		await ctx.reply(
			`${name}, я ваш ассистент. Пока умею хранить заметки в приложении.` +
				(keyboard ? '' : '\n\n(MINI_APP_URL не задан — кнопка приложения появится позже.)'),
			{ reply_markup: keyboard },
		);
	});

	return router;
}
