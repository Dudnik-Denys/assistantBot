---
name: add-new-module
description: Добавление нового модуля (раздела) Mini App tgAssistantBot (счётчики, напоминания, вакансии…) по образцу заметок — модель Prisma и миграция, схема и сервис в packages/core, API SvelteKit, клиент, страницы списка и редактора, компоненты, пункт главного меню, unit- и интеграционные тесты. Использовать, когда нужно сделать новый модуль, раздел или сущность с CRUD; вызывается и как /add-new-module <модуль>.
argument-hint: "<модуль, например: счётчики>"
---

# add-new-module

Добавь новый модуль приложения: `$ARGUMENTS`

Эталон — раздел «Заметки». Перед началом прочитай его код, чтобы повторить актуальные решения, а не только шаблоны: `packages/core/src/notes/`, `apps/web/src/routes/api/notes/`, `apps/web/src/routes/notes/`, `apps/web/src/lib/components/notes/`.

Соблюдай правила проекта: `.claude/CLAUDE.md`, `.claude/rules/code.md`, `ui.md`, `svelte.md`.

## 1. Уточни задачу, прежде чем писать код

Если из запроса и CLAUDE.md это не ясно — спроси (одним сообщением, списком):

- какие поля у сущности, какие обязательные, какие ограничения (длина, диапазон);
- какие действия кроме создания, редактирования, удаления (например, `+1`/`−1` у счётчика);
- нужен ли поиск и по каким полям; полнотекстовый (как у заметок) или достаточно подстроки;
- связи с другими сущностями (напоминание ↔ счётчик);
- нужно ли что-то в боте (команды, кнопки, уведомления) — по умолчанию нет; если да — какие команды и что они отвечают.

Потом кратко покажи план: модель, файлы, которые создашь и изменишь. Жди подтверждения.

## 2. Имена

Выбери имена и используй их во всех шаблонах вместо плейсхолдеров:

| Плейсхолдер | Что это | Пример для счётчиков |
|---|---|---|
| `__Entity__` | сущность, PascalCase, единственное число | `Counter` |
| `__Entities__` | PascalCase, множественное | `Counters` |
| `__entity__` | camelCase, единственное | `counter` |
| `__entities__` | camelCase, множественное; это же путь маршрутов и API | `counters` |
| `__ENTITY__` | префикс констант | `COUNTER` |
| `__Title__` | название раздела в меню и шапке | `Счётчики` |
| `__one__` | одна сущность, винительный падеж, для текстов | `счётчик` |

## 3. Шаги

Шаблоны лежат в `templates/` рядом с этим файлом. Это заготовки: подставь имена, замени поле-пример `title` на реальные поля, удали то, что разделу не нужно.

1. **Модель и миграция** — `templates/prisma-model.prisma.tpl` → в `packages/db/prisma/schema.prisma`; в модели `User` добавь обратную связь. Миграция: `bun run db:migrate -- --name add___entities__`. Команда требует подтверждения пользователя и запущенный Postgres (`docker compose up -d`); если не получилось — остановись и попроси пользователя выполнить её самому.
2. **Константы, схема и DTO** (раскладка — `code.md`, «Где что лежит в core») — `templates/core-constants.ts.tpl` → `packages/core/src/constants/__entities__.ts` (без зависимостей, импортируется и клиентом) и вход `./constants/__entities__` в `packages/core/package.json`; `templates/core-schema.ts.tpl` → `packages/core/src/schemas/__entities__/__entity__-input.ts` (только схема и выведенный тип); `templates/core-types.ts.tpl` → `packages/core/src/__entities__/types.ts` (интерфейс DTO).
3. **Сервис** — `templates/core-service.ts.tpl` → `packages/core/src/__entities__/service.ts`. Проверка id (`assertId` из `common/id.ts`) и запрос списка (`ListQuerySchema` из `schemas/common/list-query.ts`) — общие; свои не пиши. В `packages/core/src/index.ts` добавь именованные экспорты только того, что нужно приложениям: `create__Entities__Service`, типы `__Entity__Dto` и `__Entity__Input` (и `__Entities__Service`, если сервис передаётся в бот). Схемы ввода и `to__Entity__Dto` остаются внутри core.
4. **Регистрация сервиса** — в `apps/web/src/lib/server/services.ts`: `export const __entities__ = create__Entities__Service(db);`
5. **API** — `templates/api-collection.server.ts.tpl` → `apps/web/src/routes/api/__entities__/+server.ts`, `templates/api-item.server.ts.tpl` → `.../api/__entities__/[id]/+server.ts`. Доп. действия (`+1`) — отдельным методом сервиса и отдельным эндпоинтом или `PATCH`, обсуди с пользователем.
6. **Клиент API** — `templates/api-client.ts.tpl`: одна строка `new RestResource<Dto, Input>(http, '/<раздел>')` в объекте `api` в `apps/web/src/lib/api.ts` и реэкспорт DTO. Нестандартные действия — наследник `RestResource` (`lib/http/rest-resource.ts`) в том же файле.
7. **Компоненты раздела** — папка `apps/web/src/lib/components/__entities__/`: `templates/Card.svelte.tpl` → `__Entity__Card.svelte`, `templates/Editor.svelte.tpl` → `__Entity__Editor.svelte`. Используй готовые компоненты из `ui/` (`Card`, `Button`, `ActionBar`, `BackButton`, `SectionTitle`, поля с `field-bare`); новое общее — в `ui/<группа>/`.
8. **Страницы** — `templates/list-page.svelte.tpl` → `routes/__entities__/+page.svelte`; `templates/new-page.svelte.tpl` → `routes/__entities__/new/+page.svelte`; `templates/item-page.ts.tpl` и `templates/item-page.svelte.tpl` → `routes/__entities__/[id]/+page.ts` и `+page.svelte`.
9. **Пункт меню** — в `apps/web/src/lib/constants/sections.ts`: `{ href: resolve('/__entities__'), title: '__Title__', description: '…', icon: '…' }`.
10. **Бот (если нужен)** — по `.claude/rules/bot.md`, раздел «Как добавить команду или раздел»: имена в `BotCommand` и `COMMAND_MENU`, роутер `apps/bot/src/routers/__entities__.ts` (фабрика `create__Entities__Router(deps)` с сервисом из `packages/core`), сервис — в `RouterDeps`/`BotDeps` и `index.ts`, подключение в `createPrivateRouter`, клавиатуры — `keyboards/__entities__.ts`, префикс кнопок — в `constants/`. Логика — тот же сервис, что у API, без дублирования.
11. **Тесты** — по `.claude/rules/tests.md`: `tests/unit/__entities__/` — схема ввода (валидные и невалидные данные, граничные значения) и чистые функции модуля; `tests/integration/__entities__/service.test.ts` — каждый метод сервиса, включая чужие записи (`NotFoundError`), неверный id и некорректный ввод (образец — `tests/integration/notes/service.test.ts`). Фабрика `createTest__Entity__` — в `tests/helpers/factories.ts`.
12. **Документация** — в `.claude/CLAUDE.md` обнови «Project status» и при необходимости архитектуру.

Полный список того, что легко забыть, — `checklist.md`. Пройди его перед завершением.

## 4. Проверка

- `bun run format`, затем `bun run lint`, `bun run check`, `bun run test:unit __entities__`, `bun run test:integration __entities__`, `bun run build:web` — всё должно проходить.
- Или команды `/verify-server` и `/verify-ui`.
- Web-сервер и бота сам не запускай (они читают `.env`). В конце дай пользователю список ручных проверок: открыть меню → раздел → создать → изменить → удалить → поиск → «Назад» в Telegram и в браузере → открыть несуществующий `/__entities__/abc`; если раздел есть в боте — его команды и кнопки в Telegram.

Не коммить без подтверждения пользователя.
