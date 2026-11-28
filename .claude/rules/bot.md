---
paths:
  - "apps/bot/**"
---

# Бот (grammY)

Следуй официальной документации grammY: https://grammy.dev (раздел про большие проекты — https://grammy.dev/advanced/structuring). Общие принципы кода — в `code.md`. Структура навеяна учебным проектом на aiogram (https://github.com/mahenzon/demo-tg-bot): роутеры, middleware, клавиатуры по папкам; aiogram `Router` в grammY — `Composer`.

## Структура `apps/bot/src`

| Папка / файл | Что там |
|---|---|
| `index.ts` | Только запуск — единственное место, где читается `env` и создаются БД и сервисы из `packages/core`: вызывает `createBot(deps)`, `setMyCommands(COMMAND_MENU)`, корректная остановка, `bot.start()` |
| `bot.ts` | `createBot(deps)` — собирает бота: плагины API, middleware и роутеры в нужном порядке, `bot.catch`. Бота не запускает. Всё внешнее (токен, сервисы, настройки) — в `BotDeps` |
| `context.ts` | Тип `BotContext` (поля, которые добавляют middleware, например `user?`), `PrivateContext` — контекст после allowlist с обязательным `user`, и `hasUser` — проверка, которой `bot.ts` подключает приватные роутеры |
| `env.ts` | Разбор переменных окружения: `parseEnv(EnvSchema, заголовок)` из `@tgab/core/env`, схема — `schemas/env.ts`; при ошибке бот не стартует и перечисляет все проблемы. Общие схемы — из `@tgab/core/env`: `optionalEnv(…)` для необязательных (пустая строка = не задано), `TelegramIdSchema` для telegramId. Новая переменная — в схему и сразу в таблицу README |
| `errors.ts` | `handleBotError` — единственное место, где разбираются ошибки (`GrammyError`, `HttpError`, остальные) |
| `middlewares/` | Промежуточные обработчики для всех апдейтов: логирование (тип апдейта и команда — без текста сообщений: там личные данные), allowlist, в будущем ограничение частоты |
| `routers/` | Обработчики: один файл — одна команда или один раздел (`commands/start.ts`; раздел — например, будущий `counters.ts`, пока такого нет). `routers/index.ts` — какие роутеры и в каком порядке подключаются, `routers/deps.ts` — тип `RouterDeps` |
| `keyboards/` | Функции, которые строят клавиатуры (`InlineKeyboard`, `Keyboard`). Данные для кнопок получают аргументами |
| `schemas/` | zod-схемы только для бота (`env.ts` — `EnvSchema`, позже — данные кнопок и ввода); общие с Mini App — в `packages/core/src/schemas/` (`code.md`, «Схемы zod») |
| `constants/` | Значения без логики: имена команд (`BotCommand`) и меню (`COMMAND_MENU`), префиксы данных кнопок. Объекты `as const`, не `enum` |

Импорты внутри бота — через алиас `#bot/…` с явным расширением (`#bot/routers/index.ts`); относительные пути не используются.

## Роутеры

- Роутер — `Composer<BotContext>`, приватный (после allowlist) — `Composer<PrivateContext>`: в нём `ctx.user` обязателен, без `!` и проверок. Без зависимостей — экспортируется готовым (`export const idRouter = new Composer<BotContext>()`); если нужны сервисы или настройки — фабрика `createXRouter(deps)`, зависимости аргументами, не глобальным импортом `env`.
- Порядок подключения задаётся в одном месте (`bot.ts` и `routers/index.ts`) и важен: лог → `publicRouter` (доступно всем, например `/id`) → allowlist → `bot.filter(hasUser, createPrivateRouter(deps))` (только для своих). Новый раздел — в `createPrivateRouter`, если нет причины открыть его всем. Обработчик «всё остальное» (если появится) подключается последним.
- Обработчики тонкие: разобрать апдейт, вызвать сервис из `packages/core` (с `ctx.user.id`), ответить. Бизнес-логика, запросы к БД и форматы хранения — в `packages/core`, общие с Mini App.
- Имена команд — только из `BotCommand` (`bot.command(BotCommand.Start, …)`), не строками. Новая команда — в `BotCommand` и, если её видно пользователю, в `COMMAND_MENU`.

## Как добавить команду или раздел

1. Имя команды — в `BotCommand`; видимую пользователю — ещё и в `COMMAND_MENU` (описание по-русски).
2. Роутер — `routers/commands/<команда>.ts` для одиночной команды или `routers/<раздел>.ts` для раздела с несколькими командами и кнопками (пример — будущий раздел счётчиков `counters.ts`: в боте его пока нет, это образец структуры, а не существующий файл).
3. Нужен сервис из `packages/core` — добавь его в `RouterDeps` (`routers/deps.ts` — отдельно от `routers/index.ts`, чтобы роутеры и `index.ts` не импортировали друг друга) и `BotDeps`, создай в `index.ts` и передай в `createBot`; роутер делай фабрикой `createXRouter(deps)`.
4. Подключи роутер в `createPrivateRouter` (или в `publicRouter`, если команда нужна до входа).
5. Клавиатуры раздела — `keyboards/<раздел>.ts`, префиксы данных кнопок — в `constants/`.
6. `bun run format`, затем проверки — через субагента `verifier` (режим `server`, CLAUDE.md, «Commands»); бота сам не запускай (он читает `.env`) — дай пользователю список ручных проверок в Telegram.

## Данные и проверки

- Всё, что пришло от пользователя (текст, данные кнопок), проверяется zod-схемой до передачи в сервис. Схема, общая с API Mini App, — в `packages/core/src/schemas/`; только боту нужная — в `apps/bot/src/schemas/`, а не в файле роутера.
- Данные inline-кнопок (`callback_data`, до 64 байт) — с префиксом раздела из `constants/` (`counter:inc:<id>`), разбираются схемой; обработчики подписываются через `callbackQuery` с префиксом. На каждый `callback_query` отвечать `ctx.answerCallbackQuery()`.
- Тексты с разметкой — `parse_mode: 'HTML'`; пользовательские строки в HTML экранировать.

## Ошибки и лимиты

- Ошибки не глушатся в обработчиках: они уходят в `bot.catch` → `handleBotError`. Ловить локально — только чтобы ответить пользователю понятным текстом (например, `NotFoundError` из core).
- Повторы при 429 и сбоях сети делает `@grammyjs/auto-retry` (подключён в `bot.ts`); вручную `retry_after` не обрабатывать.
- Получение обновлений — только long polling (`bot.start()`), один экземпляр на токен (см. CLAUDE.md). Webhook-файлы не заводить без решения о переходе.
