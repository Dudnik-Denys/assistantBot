import type { User } from '@tgab/db';
import type { Context } from 'grammy';

/** Контекст бота: `user` заполняет middleware allowlist для всех обработчиков после него. */
export type BotContext = Context & { user?: User };

/** Контекст обработчиков после allowlist: пользователь уже известен. */
export type PrivateContext = BotContext & { user: User };

/** Пропускает дальше только апдейты, у которых allowlist записал пользователя. */
export function hasUser(ctx: BotContext): ctx is PrivateContext {
	return ctx.user !== undefined;
}
