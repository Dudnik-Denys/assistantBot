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
  e2e/<модуль>/…            # Playwright (появится позже) — правила в e2e.md
  helpers/                  # test-database.ts (класс TestDatabase), factories.ts (тестовые записи),
                            # test-env.ts (проверенный env тестов), commands.ts (spawnCommand),
                            # fake-fetch.ts (createFakeFetch — подменный fetch для кода Mini App)
  schemas/                  # zod-схемы тестов: env.ts (TestEnvSchema), cli.ts (TestTypeSchema),
                            # fake-api.ts (тело запроса к фейковому API в unit/http)
  constants/                # константы тестов: test-database.ts (сервис, порт, имя БД), paths.ts,
                            # http.ts (API_BASE_URL, FAKE_ORIGIN)
  run-tests.ts              # запускалка для `bun run test:<тип>`
```

- Модуль — функциональная часть приложения: `notes`, `counters`, `reminders`, `users`, `auth`. Папка модуля одна на тип и собирает тесты этого модуля из всех пакетов (core, bot, web). Общий код вне модулей — папкой по его месту в `src`: core — `tests/unit/common/` (`common/` и `schemas/common/`), `tests/unit/env/` (`schemas/env/`); Mini App — `tests/unit/http/` (`lib/http/` и `lib/errors.ts`).
- Файл называется по тому, что проверяет: `tests/unit/notes/search.test.ts` → `packages/core/src/notes/search.ts`, `tests/unit/notes/note-input.test.ts` → `schemas/notes/note-input.ts`, `tests/integration/notes/service.test.ts` → `notes/service.ts`. Unit и integration — `*.test.ts` (e2e — `*.spec.ts`, см. `e2e.md`).
- Новый модуль — новые папки `tests/unit/<модуль>/` и `tests/integration/<модуль>/`; в `package.json` ничего добавлять не нужно.

## Импорты

- Внутренности core — через алиас `#core/…` (`#core/notes/search.ts`), код Mini App — через `#web/…` (`#web/lib/http/client.ts`); алиасы заданы в `tests/tsconfig.json` (`paths`), а не в `package.json`: путь за пределы пакета там запрещён. Unit-тестами покрывается код Mini App без рун и DOM (`lib/http/`, `lib/errors.ts`, `lib/utils/`); классы с рунами (`lib/reactive/`) и компоненты — e2e (`e2e.md`).
- Integration-тесты по возможности импортируют публичный API (`@tgab/core`) — так проверяется то, чем пользуются приложения. `#core/…` — для того, что наружу не экспортируется (константы, внутренние функции).
- Хелперы — относительным путём (`../../helpers/test-database.ts`).

## Что каким тестом проверять

- **unit** — чистые функции и схемы: валидные и невалидные данные, граничные значения (пустая строка, лимит, лимит + 1), даты и часовые пояса (переход на летнее время, конец месяца, 29 февраля).
- **integration** — каждый метод сервиса: успешный путь, чужие данные (`NotFoundError`, а не доступ к чужой записи), неверный id, некорректный ввод (`ZodError`), запросы с сырым SQL (спецсимволы и попытка SQL-инъекции в поиске).
- Prisma не подменяется (mock): integration-тест ходит в настоящую тестовую БД, иначе проверяется подмена, а не запрос.
- Сеть в unit-тестах Mini App — через `createFakeFetch` (`helpers/fake-fetch.ts`): передаётся как `fetchFn` в `HttpClient.request` или подменяет глобальный `fetch` (`spyOn(globalThis, 'fetch')`, в `afterEach` — `mockRestore()`).
- Новая функция core без тестов не считается готовой. Исправленная ошибка получает тест, который её воспроизводит.

## Тестовая БД

- Отдельный контейнер `postgres-test` (`docker-compose.yml`, профиль `test`): данные в памяти (`tmpfs`), после остановки ничего не остаётся, с рабочей базой не связан. `bun run test:integration` поднимает его и применяет миграции сам; в CI (переменная `CI`) базу даёт CI.
- Адрес — `TEST_DATABASE_URL` или по умолчанию контейнер (`localhost:${POSTGRES_TEST_PORT:-5434}/tgab_test`). Имя базы обязано кончаться на `_test` — иначе `TestDatabase.fromEnv()` откажется работать, чтобы не очистить рабочую базу. Переменные env тестов (`CI`, `TEST_DATABASE_URL`, `POSTGRES_TEST_PORT`) проверяются схемой `TestEnvSchema` (`helpers/test-env.ts`), значения контейнера — константы в `constants/test-database.ts` (совпадают с `docker-compose.yml`).
- Тестовая БД — класс `TestDatabase` (`helpers/test-database.ts`): `fromEnv()` — адрес, `prepare()` — контейнер и миграции (вызывает запускалка), `createClient()`, `reset(db)` — очистка всех таблиц. В каждом файле: `const testDatabase = TestDatabase.fromEnv()`, `const db = testDatabase.createClient()`, `beforeEach(() => testDatabase.reset(db))`, `afterAll(() => db.$disconnect())`. Тесты не зависят друг от друга и от порядка запуска.
- Данные — через фабрики из `helpers/factories.ts` (`createTestUser`, `createTestNote`): они создают записи через сервисы core. Новая сущность — новая фабрика там же, а не `db.x.create` в каждом тесте.
- Остановить контейнер: `docker compose --profile test stop`.

## Оформление

- `describe` — имя проверяемой функции или метода (`describe('list', …)`); `test` — ожидаемое поведение по-русски, **обезличенно, в именном стиле**: с заглавной буквы, с отглагольного существительного, а не с глагола — `test('Отклонение пустой заметки', …)`, `test('Выброс NotFoundError для чужой заметки вместо доступа к ней', …)`, `test('Возврат null для незнакомого пользователя без создания записи', …)`. Не «отклоняет…», «возвращает…», не «чужая заметка — NotFoundError». Значения из констант подставляются в описание шаблонной строкой: `` test(`Ограничение заголовка ${NOTE_TITLE_MAX} символами включительно`, …) ``.
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
