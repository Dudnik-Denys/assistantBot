# Чек-лист нового раздела

## БД и core

Соглашения по моделям, миграциям и SQL — `.claude/rules/db.md`.

- [ ] Модель: `id` `uuid(7)`, `userId` со связью `onDelete: Cascade`, `createdAt`/`updatedAt` в `Timestamptz(3)`, индекс `[userId, …]` под основной список.
- [ ] Обратная связь в модели `User`.
- [ ] Миграция создана и применена; если в ней есть ручной SQL (generated-колонки, триггеры) — повторён в схеме так, чтобы `migrate dev` не создавал лишнюю миграцию (см. `Note.search` в CLAUDE.md).
- [ ] zod-схема ввода — в `packages/core/src/schemas/<модуль>/`, рядом только выведенный тип: `trim`, лимиты из констант, понятные сообщения об ошибках на русском.
- [ ] Константы модуля — в `packages/core/src/constants/<модуль>.ts` без зависимостей; нужные клиенту — через вход `./constants/<модуль>` в `package.json` пакета.
- [ ] Интерфейс DTO — в `packages/core/src/<модуль>/types.ts`, не в файле схемы.
- [ ] DTO: даты — ISO-строки, `bigint` — строки; функция `to__Entity__Dto`.
- [ ] Каждый метод сервиса принимает `userId` и фильтрует по нему; чужой или несуществующий id → `NotFoundError`, а не 403 (не раскрываем существование).
- [ ] Проверка формата id до запроса в БД — общим `assertId` (`core/src/common/id.ts`); текст «не найдено» — одна константа `NOT_FOUND` на сервис.
- [ ] Запрос списка — общий `ListQuerySchema` (`core/src/schemas/common/list-query.ts`), без своих чисел для `limit` и длины поиска.
- [ ] Схемы названы `PascalCase` + `Schema` (`CounterInputSchema`), тип — тем же именем без `Schema`.
- [ ] В `packages/core/src/index.ts` — именованные экспорты только того, что используют приложения (сервис, DTO, тип ввода); не `export *`.

## API
- [ ] Сервис зарегистрирован в `lib/server/services.ts`.
- [ ] Эндпоинты тонкие: `requireUser` → сервис → `Response.json`, всё в `handleApi`. Хелпер `json` из `@sveltejs/kit` не использовать.
- [ ] Коды ответов: `201` на создание, `204` на удаление.
- [ ] Ресурс в `lib/api.ts` через `RestResource` (`get` уже принимает `fetchFn` для `load`, `list` — `signal` для отмены); доп. действия — наследником.

## UI
- [ ] Список: `PageHeader` (с `onback` в меню) + `DebouncedSearch` + `Message` для состояний (загрузка, ошибка, пусто, ничего не найдено) + `FloatingButton`.
- [ ] Страница элемента загружает данные в `+page.ts` (`load`), ошибки — через `error()` в `+error.svelte`.
- [ ] Редактор: локальная копия полей, `dirty`/`empty`, подтверждение выхода без сохранения, `haptic`, `ActionBar`, `BackButton`; `{#key id}` на странице элемента.
- [ ] Компоненты раздела — в `components/__entities__/`, общие — в `ui/<группа>/`; импорты через `#lib/...`.
- [ ] Цвета и размеры — только токены; длинные `class` — массивом по группам; класс снаружи — через `mergeClasses()`.
- [ ] Руны, никакого синтаксиса Svelte 4; ключи в `{#each}`.
- [ ] Пункт в `lib/constants/sections.ts` с `href: resolve('/__entities__')`.
- [ ] Все внутренние ссылки и `goto` — через `resolve()` из `$app/paths`, без строк-адресов.

## Бот (если раздел в нём есть)
- [ ] Команды — в `BotCommand`, видимые — в `COMMAND_MENU`; в коде никаких строк-команд.
- [ ] Роутер `routers/__entities__.ts` — фабрика с сервисом из `deps`, не импортирует `env` и не создаёт БД; подключён в `createPrivateRouter`.
- [ ] Обработчики тонкие: ввод проверен zod-схемой (общей с API, если подходит), вызов сервиса с `ctx.user.id`, ответ.
- [ ] Данные кнопок — с префиксом из `constants/`, на каждый `callback_query` — `answerCallbackQuery()`.
- [ ] Импорты через `#bot/…`.

## Завершение
- [ ] `tests/unit/<модуль>/` — схема и чистые функции; `tests/integration/<модуль>/` — все методы сервиса, чужие записи, неверный id, некорректный ввод.
- [ ] Фабрика тестовых записей — в `tests/helpers/factories.ts`.
- [ ] `bun run format`, `lint`, `check`, `test:unit`, `test:integration`, `build:web` проходят.
- [ ] CLAUDE.md обновлён.
- [ ] Пользователю выдан список ручных проверок.
