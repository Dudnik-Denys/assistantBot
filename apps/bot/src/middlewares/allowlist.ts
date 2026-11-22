import { toTelegramIdentity, type UsersService } from '@tgab/core';
import type { MiddlewareFn } from 'grammy';
import type { BotContext } from '#bot/context.ts';

/**
 * Allowlist: дальше проходят только известные пользователи, их запись кладётся в `ctx.user`.
 * Незнакомым в личном чате отвечает, куда обратиться; в группах молчит.
 */
export function createAllowlist(users: UsersService): MiddlewareFn<BotContext> {
	return async (ctx, next) => {
		if (!ctx.from || ctx.from.is_bot) return;
		const user = await users.authenticate(toTelegramIdentity(ctx.from));
		if (!user) {
			if (ctx.chat?.type === 'private') {
				await ctx.reply(
					`Доступ закрыт. Передайте администратору ваш Telegram ID: <code>${ctx.from.id}</code>`,
					{ parse_mode: 'HTML' },
				);
			}
			return;
		}
		ctx.user = user;
		await next();
	};
}
