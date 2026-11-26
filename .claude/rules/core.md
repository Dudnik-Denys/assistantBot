---
paths:
  - packages/core/**
---

# Бизнес-логика (`packages/core`)

Общие принципы кода — в `code.md`; запросы к БД и сырой SQL — в `db.md`. Логика живёт здесь, а бот и эндпоинты SvelteKit — тонкие слои над ней (CLAUDE.md, «Architecture»).

## Где что лежит

Папки по типу содержимого, внутри — по модулям (как `tests/<тип>/<модуль>/`):

| Путь в `packages/core/src/` | Что |
|---|---|
| `schemas/<модуль>/<тема>.ts` | zod-схемы и выведенные из них типы: ввод (`schemas/notes/note-input.ts` — `NoteInputSchema`, `NoteInput`) и ответ API (`note-dto.ts` — `NoteDtoSchema`, `NoteDto`: по ней Mini App проверяет ответы). Группы вне модулей — `schemas/common/` (`id.ts`, `list-query.ts`, `dto.ts` — общие поля ответа), `schemas/env/variables.ts` (схемы env и CLI). `schemas/dto.ts` — вход `@tgab/core/dto`: схемы ответов для браузера (без сервисов и Prisma) |
| `constants/<модуль>.ts` | Константы модуля, без зависимостей (`constants/notes.ts` — лимиты, `NOTE_TITLE_REQUIRED_MESSAGE`, `SEARCH_WORDS_MAX`; `constants/users.ts` — `DEFAULT_TIMEZONE`); общие — `constants/list.ts`. Нужные клиенту — через вход `@tgab/core/constants/<модуль>` |
| `<модуль>/service.ts` | Сервис (фабрика `createXService(db)`) и `toXDto` |
| `<модуль>/types.ts` | Реэкспорт типа DTO (`NoteDto` — выводится из схемы `schemas/<модуль>/<сущность>-dto.ts`) и интерфейсы, которые из схем не выводятся (`TelegramIdentity`, `ProcessDueResult`) |
| `<модуль>/<тема>.ts` | Прочая логика модуля (`notes/search.ts`, `auth/init-data.ts`) |
| `env/` | Вход `@tgab/core/env` (`index.ts`): схемы env и CLI из `schemas/env/` и `parseEnv` (`parse.ts`) — разбор env при старте приложения. Зависит только от zod |
| `common/` | Логика, общая для модулей (`common/id.ts` — `assertId`, `common/parse-input.ts` — `parseInput`, `common/html.ts` — `escapeHtml`) |
| `errors.ts`, `index.ts` | Доменные ошибки; публичный API пакета |

Общее для нескольких модулей — один раз, а не копией в каждом сервисе: логика — `common/`, схемы — `schemas/common/` (`IdSchema`, `ListQuerySchema`), константы — `constants/list.ts`.

## Сервисы

- Сервис — фабрика `createXService(db, …)`, возвращающая объект с методами: та же инкапсуляция и внедрение зависимостей, что у класса. Новые сервисы — в том же стиле, чтобы проект был единообразным. Зависимости (БД, настройки, другие сервисы) — аргументами фабрики, не глобальным импортом.
- Каждый метод пользовательских данных принимает `userId` явно и работает только с записями этого пользователя; id записи проверяется `assertId` до запроса.
- Метод, который принимает данные снаружи (тело запроса, query-параметры, текст из бота), объявляет их как `input: unknown` / `query: unknown` и сам разбирает схемой через `parseInput(NoteInputSchema, input)` (`common/parse-input.ts`): ошибка ввода — `ValidationError` с текстом схемы (транспорт отвечает 400), а не `ZodError` — иначе такая же ошибка из бага тоже стала бы «некорректными данными». Тип ввода (`NoteInput`) экспортируется для клиента, который эти данные формирует.
- Наружу — DTO (`toXDto`), а не модели Prisma (подробно — `db.md`).

## Ошибки

Ошибки предметной области — свои классы в `src/errors.ts`; все наследуют `DomainError` (он задаёт `name`), классы ошибок в других файлах не объявляются. Транспортный слой переводит их в HTTP-коды (`api.md`) или ответы бота (`bot.md`) в одном месте. Класс ошибки появляется, когда его кто-то выбрасывает, а не «на будущее».

## Публичный API

`src/index.ts` экспортирует поимённо только то, что используют приложения (`export *` не используется); внутреннее (схемы ввода, `toXDto`, вспомогательные функции) остаётся внутри пакета, тесты импортируют его напрямую (`#core/…`). Отдельные входы в `package.json` (`exports`): `@tgab/core/env` и `@tgab/core/constants/<модуль>` — без зависимостей от сервисов и БД, их можно импортировать в браузерный код и `env.ts`.
