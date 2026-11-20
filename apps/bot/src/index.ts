import { autoRetry } from '@grammyjs/auto-retry';
import { createUsersService } from '@tgab/core';
import { createPrismaClient, type User } from '@tgab/db';
import { Bot, type Context, GrammyError, HttpError, InlineKeyboard } from 'grammy';
import { env } from './env.ts';

type BotContext = Context & { user?: User };

const db = createPrismaClient(env.DATABASE_URL);
const users = createUsersService(db, { adminTelegramId: env.ADMIN_TELEGRAM_ID });

const bot = new Bot<BotContext>(env.BOT_TOKEN);
bot.api.config.use(autoRetry());

// Лог апдейтов и исходящих вызовов API — помогает разбираться с дублями и ошибками.
bot.use(async (ctx, next) => {
  const text = ctx.message?.text ?? ctx.callbackQuery?.data ?? '';
  console.log(`← update ${ctx.update.update_id} from ${ctx.from?.id}: ${text}`);
  await next();
});
bot.api.config.use(async (prev, method, payload, signal) => {
  const started = Date.now();
  const res = await prev(method, payload, signal);
  if (method !== 'getUpdates') console.log(`→ ${method} ${res.ok ? 'ok' : res.description} (${Date.now() - started} ms)`);
  return res;
});

// /id доступна всем: по ней узнают свой telegramId, чтобы попросить доступ.
bot.command('id', (ctx) =>
  ctx.reply(`Ваш Telegram ID: <code>${ctx.from?.id}</code>`, { parse_mode: 'HTML' }),
);

// Allowlist: дальше проходят только известные пользователи.
bot.use(async (ctx, next) => {
  if (!ctx.from || ctx.from.is_bot) return;
  const user = await users.authenticate({
    telegramId: BigInt(ctx.from.id),
    firstName: ctx.from.first_name,
    username: ctx.from.username,
  });
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
});

bot.command('start', async (ctx) => {
  const name = ctx.user?.firstName ?? 'привет';
  const keyboard = env.MINI_APP_URL
    ? new InlineKeyboard().webApp('Открыть приложение', env.MINI_APP_URL)
    : undefined;
  await ctx.reply(
    `${name}, я ваш ассистент. Пока умею хранить заметки в приложении.` +
      (keyboard ? '' : '\n\n(MINI_APP_URL не задан — кнопка приложения появится позже.)'),
    { reply_markup: keyboard },
  );
});

bot.catch(({ error, ctx }) => {
  const where = `update ${ctx.update.update_id}`;
  if (error instanceof GrammyError) console.error(`Telegram API error (${where}):`, error.description);
  else if (error instanceof HttpError) console.error(`Network error (${where}):`, error.error);
  else console.error(`Error (${where}):`, error);
});

await bot.api.setMyCommands([
  { command: 'start', description: 'Начало работы' },
  { command: 'id', description: 'Показать мой Telegram ID' },
]);

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
