import type { User } from '@tgab/db';
import type { Context } from 'grammy';

/** Контекст бота: `user` заполняет middleware allowlist для всех обработчиков после него. */
export type BotContext = Context & { user?: User };
