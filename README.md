# tgAssistantBot

Telegram-бот с Mini App для ежедневных рутинных задач: заметки, счётчики, напоминания, погода, вакансии. Сервис для закрытого круга пользователей — доступ по allowlist, у каждого свои данные.

Сейчас готовы заметки (текст, ссылки, поиск) в Mini App и минимальный бот (`/start`, `/id`, allowlist).

## Стек

- **Рантайм:** Bun, монорепо на Bun workspaces
- **Бот:** grammY (long polling)
- **Mini App и API:** SvelteKit + Svelte 5, Tailwind CSS v4
- **БД:** PostgreSQL + Prisma
- **Фоновые задачи (план):** BullMQ + Redis
- **Сервис погоды (план):** Python, FastAPI

## Структура

```
apps/web       # SvelteKit: Mini App + API (/api/*)
apps/bot       # бот на grammY
packages/core  # бизнес-логика и типы
packages/db    # схема Prisma, миграции, клиент
```

## Быстрый старт

Нужны [Bun](https://bun.sh) и Docker (на macOS — OrbStack или Docker Desktop).

1. Получите токен **отдельного dev-бота** у [@BotFather](https://t.me/BotFather).
2. Создайте в корне репозитория файл `.env` с переменными из раздела ниже. Обязателен `BOT_TOKEN`.
3. Запустите:

   ```bash
   ./run.sh        # Docker, Postgres и Redis, зависимости, миграции, web + bot
   ```

4. Напишите боту `/id`, впишите полученный ID в `ADMIN_TELEGRAM_ID` (и `DEV_TELEGRAM_ID`) и перезапустите `./run.sh`.
5. Mini App: `http://localhost:5173` в браузере (при заданном `DEV_TELEGRAM_ID`) или в Telegram через HTTPS-туннель (например, `ngrok http 5173`), адрес которого указан в `MINI_APP_URL`.

## Переменные окружения

Файл `.env` в корне репозитория. Он не попадает в git — у каждой машины свой.

| Переменная | Обязательна | Пример / значение по умолчанию | Описание |
|---|---|---|---|
| `BOT_TOKEN` | да | — | Токен бота от BotFather. Нужен боту и web-серверу (проверка подписи `initData` Mini App). **Секрет.** |
| `DATABASE_URL` | да | `postgresql://tgab:tgab@localhost:5432/tgab` | Подключение к Postgres из `docker-compose.yml`. |
| `ADMIN_TELEGRAM_ID` | желательно | — | Ваш Telegram ID (узнать — `/id` у бота). Только цифры. При первом входе создаётся пользователь-админ. Без него доступа не будет ни у кого. |
| `MINI_APP_URL` | нет | — | HTTPS-адрес Mini App (в разработке — адрес туннеля). Если задан, `/start` показывает кнопку «Открыть приложение». Адрес с `http://` бот не примет и не запустится: Telegram открывает Mini App только по HTTPS. |
| `DEV_TELEGRAM_ID` | нет | — | Только для `vite dev`: открывать Mini App в обычном браузере от имени этого Telegram ID (он должен быть в allowlist). |
| `POSTGRES_PORT` | нет | `5432` | Порт Postgres на хосте. Если занят — поменяйте его и порт в `DATABASE_URL`. |
| `REDIS_PORT` | нет | `6379` | Порт Redis на хосте. |
| `REDIS_URL` | нет | `redis://localhost:6379` | Redis для будущего воркера напоминаний. |

Минимальный `.env` для разработки:

```bash
DATABASE_URL=postgresql://tgab:tgab@localhost:5432/tgab
BOT_TOKEN=
ADMIN_TELEGRAM_ID=
DEV_TELEGRAM_ID=
MINI_APP_URL=
```

Новые пользователи добавляются в allowlist командой `bun run user:allow <telegramId>`.

## Команды

```bash
./run.sh [web|bot]      # всё сразу (по умолчанию web + bot)
bun run dev:web         # Mini App + API на http://localhost:5173
bun run dev:bot         # бот
bun run db:deploy       # применить миграции
bun run check           # проверка типов
bun test                # тесты
bun run lint            # линтер и формат (Biome + Prettier для .svelte)
bun run format          # автоисправление формата
```
