# tgAssistantBot

Telegram-бот с Mini App для ежедневных рутинных задач: заметки, счётчики, напоминания, погода, вакансии. Сервис для закрытого круга пользователей — доступ по allowlist, у каждого свои данные.

Сейчас готовы:

- в Mini App — заметки (текст, ссылки, поиск) и счётчики (ручной счёт, таймеры на срок или до даты, автоповтор);
- раздел «Напоминания» — пока только уведомления об окончании циклов счётчиков;
- минимальный бот (`/start`, `/id`, allowlist);
- воркер, который завершает циклы счётчиков и присылает уведомления в Telegram.

## Стек

- **Рантайм:** Bun, монорепо на Bun workspaces
- **Бот:** grammY (long polling)
- **Mini App и API:** SvelteKit + Svelte 5, Tailwind CSS v4
- **БД:** PostgreSQL + Prisma
- **Фоновые задачи:** BullMQ + Redis (воркер `apps/worker`)
- **Сервис погоды (план):** Python, FastAPI

## Структура

```
apps/web       # SvelteKit: Mini App + API (/api/*)
apps/bot       # бот на grammY
apps/worker    # фоновые задачи на BullMQ: циклы счётчиков, уведомления в Telegram
packages/core  # бизнес-логика и типы
packages/db    # схема Prisma, миграции, клиент
tests          # тесты всех пакетов: unit/, integration/ (позже e2e/)
```

## Быстрый старт

Нужны [Bun](https://bun.sh) и Docker (на macOS — OrbStack или Docker Desktop).

1. Получите токен **отдельного dev-бота** у [@BotFather](https://t.me/BotFather).
2. Создайте в корне репозитория файл `.env` с переменными из раздела ниже. Обязателен `BOT_TOKEN`.
3. Запустите:

   ```bash
   ./run.sh        # Docker, Postgres и Redis, зависимости, миграции, web + bot + worker
   ```

4. Напишите боту `/id`, впишите полученный ID в `ADMIN_TELEGRAM_ID` (и `DEV_TELEGRAM_ID`) и перезапустите `./run.sh`.
5. Mini App: `http://localhost:5173` в браузере (при заданном `DEV_TELEGRAM_ID`) или в Telegram через HTTPS-туннель (например, `ngrok http 5173`), адрес которого указан в `MINI_APP_URL`.

## Переменные окружения

Файл `.env` в корне репозитория. Он не попадает в git — у каждой машины свой.

| Переменная | Обязательна | Пример / значение по умолчанию | Описание |
|---|---|---|---|
| `BOT_TOKEN` | да | — | Токен бота от BotFather. Нужен боту, web-серверу (проверка подписи `initData` Mini App) и воркеру (отправка уведомлений). **Секрет.** |
| `DATABASE_URL` | да | `postgresql://tgab:tgab@localhost:5432/tgab` | Подключение к Postgres из `docker-compose.yml`. |
| `ADMIN_TELEGRAM_ID` | желательно | — | Ваш Telegram ID (узнать — `/id` у бота). Только цифры. При первом входе создаётся пользователь-админ. Без него доступа не будет ни у кого. |
| `MINI_APP_URL` | нет | — | HTTPS-адрес Mini App (в разработке — адрес туннеля). Если задан, `/start` показывает кнопку «Открыть приложение», а сообщения воркера об окончании цикла счётчика — кнопку «Открыть уведомление». Адрес с `http://` бот не примет и не запустится: Telegram открывает Mini App только по HTTPS. |
| `DEV_TELEGRAM_ID` | нет | — | Только для `vite dev`: открывать Mini App в обычном браузере от имени этого Telegram ID (он должен быть в allowlist). |
| `POSTGRES_PORT` | нет | `5432` | Порт Postgres на хосте. Если занят — поменяйте его и порт в `DATABASE_URL`. |
| `POSTGRES_TEST_PORT` | нет | `5434` | Порт временного Postgres для интеграционных тестов (контейнер `postgres-test`, данные в памяти). |
| `TEST_DATABASE_URL` | нет | контейнер `postgres-test` | Своя тестовая БД вместо контейнера. Имя базы обязано кончаться на `_test`: тесты очищают все таблицы. |
| `REDIS_PORT` | нет | `6379` | Порт Redis на хосте. |
| `REDIS_URL` | нет | `redis://localhost:6379` | Redis для очередей воркера (`apps/worker`, BullMQ). |

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
./run.sh                # всё сразу: Docker, БД, зависимости, миграции, web + bot
bun run dev             # все приложения apps/* (web + bot) без подготовки БД
bun run db:deploy       # применить миграции
bun run check           # проверка типов
bun run test:unit [модуль]         # unit-тесты (без БД)
bun run test:integration [модуль]  # интеграционные тесты (нужен Docker: поднимут временный Postgres)
bun run lint            # линтер и формат (Biome + Prettier для .svelte)
bun run format          # автоисправление формата
```
