---
paths:
  - tests/unit/**
  - tests/integration/**
  - tests/helpers/**
  - tests/run.ts
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
  helpers/                  # общее: test-database.ts (тестовая БД), factories.ts (тестовые записи)
  run.ts                    # запускалка для `bun run test:<тип>`
```

- Модуль — функциональная часть приложения: `notes`, `counters`, `reminders`, `users`, `auth`. Папка модуля одна на тип и собирает тесты этого модуля из всех пакетов (core, bot, web).
- Файл называется по тому, что проверяет: `tests/unit/notes/search.test.ts` → `packages/core/src/notes/search.ts`, `tests/integration/notes/service.test.ts` → `notes/service.ts`. Unit и integration — `*.test.ts` (e2e — `*.spec.ts`, см. `e2e.md`).
- Новый модуль — новые папки `tests/unit/<модуль>/` и `tests/integration/<модуль>/`; в `package.json` ничего добавлять не нужно.

## Импорты

- Внутренности core — через алиас `#core/…` (`#core/notes/search.ts`); он задан в `tests/tsconfig.json` (`paths`), а не в `package.json`: путь за пределы пакета там запрещён.
- Integration-тесты по возможности импортируют публичный API (`@tgab/core`) — так проверяется то, чем пользуются приложения. `#core/…` — для того, что наружу не экспортируется (константы, внутренние функции).
- Хелперы — относительным путём (`../../helpers/test-database.ts`).

## Что каким тестом проверять

- **unit** — чистые функции и схемы: валидные и невалидные данные, граничные значения (пустая строка, лимит, лимит + 1), даты и часовые пояса (переход на летнее время, конец месяца, 29 февраля).
- **integration** — каждый метод сервиса: успешный путь, чужие данные (`NotFoundError`, а не доступ к чужой записи), неверный id, некорректный ввод (`ZodError`), запросы с сырым SQL (спецсимволы и попытка SQL-инъекции в поиске).
- Prisma не подменяется (mock): integration-тест ходит в настоящую тестовую БД, иначе проверяется подмена, а не запрос.
- Новая функция core без тестов не считается готовой. Исправленная ошибка получает тест, который её воспроизводит.

## Тестовая БД

- Отдельный контейнер `postgres-test` (`docker-compose.yml`, профиль `test`): данные в памяти (`tmpfs`), после остановки ничего не остаётся, с рабочей базой не связан. `bun run test:integration` поднимает его и применяет миграции сам; в CI (переменная `CI`) базу даёт CI.
- Адрес — `TEST_DATABASE_URL` или по умолчанию контейнер (`localhost:${POSTGRES_TEST_PORT:-5434}/tgab_test`). Имя базы обязано кончаться на `_test` — иначе `testDatabaseUrl()` откажется работать, чтобы не очистить рабочую базу.
- В каждом файле: `const db = createTestDb()`, `beforeEach(() => resetDb(db))` (очистка всех таблиц), `afterAll(() => db.$disconnect())`. Тесты не зависят друг от друга и от порядка запуска.
- Данные — через фабрики из `helpers/factories.ts` (`createTestUser`, `createTestNote`): они создают записи через сервисы core. Новая сущность — новая фабрика там же, а не `db.x.create` в каждом тесте.
- Остановить контейнер: `docker compose --profile test stop`.

## Оформление

- `describe` — имя проверяемой функции или метода (`describe('list', …)`); `test` — ожидаемое поведение по-русски (`test('чужая заметка — NotFoundError, а не доступ', …)`).
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
