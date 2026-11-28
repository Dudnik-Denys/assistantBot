import { Composer } from 'grammy';
import type { BotContext, PrivateContext } from '#bot/context.ts';
import { idRouter } from '#bot/routers/commands/id.ts';
import { createStartRouter } from '#bot/routers/commands/start.ts';
import type { RouterDeps } from '#bot/routers/deps.ts';

/** Роутеры, доступные всем (подключаются до allowlist). */
export const publicRouter = new Composer<BotContext>(idRouter);

/**
 * Роутеры только для пользователей из allowlist: `ctx.user` в них обязателен. Новый раздел — сюда.
 */
export function createPrivateRouter(deps: RouterDeps): Composer<PrivateContext> {
	return new Composer<PrivateContext>(createStartRouter(deps));
}
