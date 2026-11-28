---
paths:
  - tests/unit/**
  - tests/integration/**
  - tests/helpers/**
  - tests/run-tests.ts
  - tests/schemas/**
  - tests/constants/**
  - tests/package.json
  - tests/tsconfig.json
---

# Тесты: unit и integration

Общие принципы кода — в `code.md`. e2e-тесты (Playwright, Page Object) — отдельные правила в `e2e.md`; ниже о них только место в структуре. Тесты — `bun:test`; это отдельный пакет workspace `@tgab/tests` (папка `tests/` в корне), его типы проверяет `bun run check`.

## Структура: тип → модуль

```
tests/
  unit/<модуль>/…           # без БД: чистая логика (схемы, расчёты, разбор данных)
  integration/<модуль>/…    # с настоящим Postgres: сервисы core
  e2e/<модуль>/…            # Playwright — правила в e2e.md
  helpers/                  # test-database.ts (класс TestDatabase), factories.ts (тестовые записи),
                            # test-env.ts (env тестов через parseEnv), commands.ts (spawnCommand),
                            # fake-fetch.ts (createFakeFetch — подменный fetch для кода Mini App),
                            # fake-bot.ts (createFakeBot — бот grammY без сети для роутеров и middleware;
                            # withUser — приватный роутер с уже записанным ctx.user)
  schemas/                  # zod-схемы тестов: env.ts (TestEnvSchema), cli.ts (TestTypeSchema),
                            # fake-api.ts (тело запроса и ответ фейкового API в unit/http),
                            # parse-env.ts (окружения-образцы для unit/env), parse-input.ts (ввод-образец)
  constants/                # константы тестов: test-database.ts (сервис, порт, имя БД), paths.ts,
                            # http.ts (API_BASE_URL, FAKE_ORIGIN), env.ts (PORT_MAX, TEST_TIME_ZONE), parse-input.ts,
                            # bot.ts (токен и id фейкового бота, FAKE_ALLOWED_USER),
                            # e2e.ts (порт, устройства, TGAB_ENV_DIR и папки отчётов e2e)
  run-tests.ts              # запускалка для `bun run test:<тип>`
```

- Модуль — функциональная часть приложения: `notes`, `counters`, `reminders` (и уведомления этого раздела — `notifications/` в core: `tests/integration/reminders/notifications.test.ts`), `users`, `auth`. Папка модуля одна на тип и собирает тесты этого модуля из всех пакетов (core, bot, web). Общий код вне модулей — папкой по его месту в `src`: core — `tests/unit/common/` (`common/` и `schemas/common/`), `tests/unit/env/` (`schemas/env/`); Mini App — `tests/unit/http/` (`lib/http/`, `lib/errors.ts` и серверный `lib/server/http.ts` — перевод ошибок в HTTP и обёртки эндпоинтов), `tests/unit/utils/` (`lib/utils/`), `tests/unit/telegram/` (`lib/telegram.ts`, без обращений к самому Telegram — чистые решения вроде `shouldUseFullscreen`). Код бота — в папке своего модуля (`tests/integration/users/allowlist.test.ts` → `middlewares/allowlist.ts`), а общий, вне модулей (`/start`, `/id`, логирование, `handleBotError`), — `tests/unit/bot/`. Задачи воркера — в папке модуля, который они обслуживают (`tests/unit/counters/counters-due-job.test.ts` → `jobs/counters-due.ts`, `tests/unit/counters/schedulers.test.ts` → `schedulers.ts`, `tests/unit/reminders/counter-notification-job.test.ts`). Функции раздела Mini App — тоже в папке модуля (`tests/unit/counters/counters.test.ts` → `lib/counters.ts`).
- Файл называется по тому, что проверяет: `tests/unit/notes/search.test.ts` → `packages/core/src/notes/search.ts`, `tests/unit/notes/note-input.test.ts` → `schemas/notes/note-input.ts`, `tests/integration/notes/service.test.ts` → `notes/service.ts`, `tests/unit/telegram/telegram.test.ts` → `lib/telegram.ts`. Unit и integration — `*.test.ts` (e2e — `*.spec.ts`, см. `e2e.md`).
- Новый модуль — новые папки `tests/unit/<модуль>/` и `tests/integration/<модуль>/`; в `package.json` ничего добавлять не нужно.

## Импорты

- Внутренности core — через алиас `#core/…` (`#core/notes/search.ts`), код Mini App — через `#web/…` (`#web/lib/http/client.ts`), бота — через `#bot/…` (`#bot/middlewares/allowlist.ts`), воркера — через `#worker/…` (`#worker/jobs/counters-due.ts`); алиасы заданы в `tests/tsconfig.json` (`paths`), а не в `package.json`: путь за пределы пакета там запрещён. Unit-тестами покрывается код Mini App без рун и DOM (`lib/http/`, `lib/errors.ts`, `lib/utils/`, функции разделов вроде `lib/counters.ts`, серверный `lib/server/http.ts`); классы с рунами (`lib/reactive/`) и компоненты — e2e (`e2e.md`).
- Integration-тесты по возможности импортируют публичный API (`@tgab/core`) — так проверяется то, чем пользуются приложения. `#core/…` — для того, что наружу не экспортируется (константы, внутренние функции).
- Хелперы — относительным путём (`../../helpers/test-database.ts`).

## Что каким тестом проверять

- **unit** — чистые функции и схемы: валидные и невалидные данные, граничные значения (пустая строка, лимит, лимит + 1), даты и часовые пояса (переход на летнее время, конец месяца, 29 февраля).
- **integration** — каждый метод сервиса: успешный путь, чужие данные (`NotFoundError`, а не доступ к чужой записи), неверный id, некорректный ввод (`ValidationError` — сервисы разбирают ввод `parseInput`), запросы с сырым SQL (спецсимволы и попытка SQL-инъекции в поиске).
- Prisma не подменяется (mock): integration-тест ходит в настоящую тестовую БД, иначе проверяется подмена, а не запрос.
- Контекст grammY в тестах бота — простой объект только с теми полями, которые читает проверяемый код (`from`, `chat`, `reply`), приведённый к `BotContext` с комментарием: настоящий `Context` отправил бы ответ в Telegram. Роутеры команд и middleware, которым нужен разбор настоящего апдейта, — через `createFakeBot(...middleware)` (`helpers/fake-bot.ts`): `send('/start')` прогоняет апдейт, а вызовы Bot API перехватываются в `calls` и в Telegram не уходят. Приватный роутер (после allowlist, `Composer<PrivateContext>`) оборачивается в `withUser(router)` — он записывает `ctx.user` (`FAKE_ALLOWED_USER`), как это делает allowlist.
- Задачи воркера — unit-тесты с подменами: сервисы core, очередь BullMQ и `Api` grammY — объекты только с вызываемыми методами, приведённые к типу с комментарием; логика сервисов проверена их integration-тестами. Пакеты `grammy` и `bullmq` — в devDependencies `@tgab/tests` (установка изолирована: из чужого пакета их не видно), версии — те же, что у бота и воркера.
- Часовой пояс процесса тестов — `TEST_TIME_ZONE` (`constants/env.ts`): запускалка задаёт `TZ`, поэтому код, который смотрит на пояс устройства (`formatShortDate`), даёт один результат на маке, домашнем ПК и в CI. Тест, которому нужен другой пояс, передаёт его явно (`formatDateTime(iso, 'Asia/Tokyo')`), а не меняет `TZ`.
- Сеть в unit-тестах Mini App — через `createFakeFetch` (`helpers/fake-fetch.ts`): передаётся как `fetchFn` в `HttpClient.request` или подменяет глобальный `fetch` (`spyOn(globalThis, 'fetch')`, в `afterEach` — `mockRestore()`).
- Новая функция core без тестов не считается готовой. Исправленная ошибка получает тест, который её воспроизводит.

## Тестовая БД

- Отдельный контейнер `postgres-test` (`docker-compose.yml`, профиль `test`): данные в памяти (`tmpfs`), после остановки ничего не остаётся, с рабочей базой не связан. `bun run test:integration` поднимает его и применяет миграции сам; в CI (переменная `CI`) базу даёт CI.
- Адрес — `TEST_DATABASE_URL` или по умолчанию контейнер (`localhost:${POSTGRES_TEST_PORT:-5434}/tgab_test`). Имя базы обязано кончаться на `_test` — иначе `TestDatabase.fromEnv()` откажется работать, чтобы не очистить рабочую базу. Переменные env тестов (`CI`, `TEST_DATABASE_URL`, `POSTGRES_TEST_PORT`) проверяются схемой `TestEnvSchema` (`helpers/test-env.ts`), значения контейнера — константы в `constants/test-database.ts` (совпадают с `docker-compose.yml`).
- Тестовая БД — класс `TestDatabase` (`helpers/test-database.ts`): `fromEnv()` — адрес, `prepare()` — контейнер и миграции (вызывает запускалка), `createClient()`, `reset(db)` — очистка всех таблиц. В каждом файле: `const testDatabase = TestDatabase.fromEnv()`, `const db = testDatabase.createClient()`, `beforeEach(() => testDatabase.reset(db))`, `afterAll(() => db.$disconnect())`. Тесты не зависят друг от друга и от порядка запуска.
- Данные — через фабрики из `helpers/factories.ts` (`createTestUser`, `createTestNote`, `createTestCounter` с заготовками `TEST_COUNTER_INPUT` и `TEST_HOUR_TIMER`, `createTestNotification` — через окончание цикла `processDue`): они создают записи через сервисы core. Новая сущность — новая фабрика там же, а не `db.x.create` в каждом тесте. Прямая правка записи (`db.user.update`) — только чтобы получить состояние, которого сервисы не создают (испорченный часовой пояс), с комментарием.
- Время — `setSystemTime` из `bun:test` (в `beforeEach` — фиксированный момент, в `afterEach` — `setSystemTime()`): старт цикла, пауза и окончание тогда предсказуемы; «прошло N минут» — новый `setSystemTime`, а не `Bun.sleep`. Prisma берёт `now()` и `@updatedAt` из того же времени.
- Остановить контейнер: `docker compose --profile test stop`.

## Оформление

- `describe` — имя проверяемой функции или метода (`describe('list', …)`); `test` — **начинается со слова «Тест»**, дальше — ожидаемое поведение по-русски, обезличенно, в именном стиле: отглагольное существительное в родительном падеже, а не глагол — `test('Тест отклонения пустой заметки', …)`, `test('Тест выброса NotFoundError для чужой заметки вместо доступа к ней', …)`, `test('Тест возврата null для незнакомого пользователя без создания записи', …)`. Не «Тест: отклоняет…», не «Тест — чужая заметка, NotFoundError». Где отглагольного существительного нет, после «Тест» — предмет проверки и через двоеточие результат: `test('Тест месяца от 31 января: последний день февраля', …)`. Значения из констант подставляются шаблонной строкой: `` test(`Тест ограничения заголовка ${NOTE_TITLE_MAX} символами включительно`, …) ``. Правило — для unit, integration и e2e; названия шагов `step()` и `describe` словом «Тест» не начинаются.
- Ожидание отказа промиса — с `await`: `await expect(promise).rejects.toThrow(NotFoundError)`.
- Числа и значения со смыслом — константами в начале файла (`ADMIN_TELEGRAM_ID`), значения по умолчанию — из core (`DEFAULT_TIMEZONE`), а не повтором литерала.

## Запуск

```
bun run test:unit                           # все unit-тесты
bun run test:unit notes                     # только tests/unit/notes
bun run test:integration notes              # integration-тесты модуля (поднимет тестовую БД)
bun run test:unit notes -t "префикс"        # тесты, в описании которых есть «префикс»
```

Общей команды `bun run test` нет: тип тестов указывается явно. Остальные флаги передаются в `bun test` как есть.

## CI

`.github/workflows/ci.yml` на каждый push в `main` и pull request: lint, типы, `test:unit`, сборка web — и параллельно `test:integration` с сервисным контейнером Postgres. e2e в CI не запускаются (`e2e.md`).
