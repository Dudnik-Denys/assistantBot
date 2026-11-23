---
name: add-new-module
description: Добавление нового модуля (раздела) Mini App tgAssistantBot (счётчики, напоминания, вакансии…) — проектирование под задачу модуля, модель Prisma и миграция, схема и сервис в packages/core, API SvelteKit, клиент, экраны из готовых частей (список, редактор, свайп, автосохранение), пункт меню, бот при необходимости, unit- и интеграционные тесты. Использовать, когда нужно сделать новый модуль, раздел или сущность; вызывается и как /add-new-module <модуль>.
argument-hint: "<модуль, например: счётчики>"
---

# add-new-module

Добавь новый модуль приложения: `$ARGUMENTS`

Модули разные: у заметок — текст и поиск, у счётчиков — `+1`/`−1`, у напоминаний — расписание. Поэтому скилл не копирует один образец целиком, а делит работу на две части:

- **Одинаковое у всех модулей** (модель, сервис с `userId`, API, клиент, загрузка элемента) — по шаблонам из `templates/`.
- **Своё у каждого модуля** (экраны, действия, поиск, бот) — проектируется под задачу и собирается из готовых частей проекта (раздел 3); живой образец — код заметок.

Правила проекта обязательны: `.claude/CLAUDE.md`, `.claude/rules/code.md`, `db.md`, `svelte.md`, `ui.md`, `tests.md`, `bot.md` (если нужен бот).

## 1. Проектирование — до кода

Если из запроса и CLAUDE.md не ясно — спроси одним сообщением, списком:

- поля сущности: какие обязательные, ограничения (длина, диапазон), значения по умолчанию;
- действия кроме создания, изменения, удаления (`+1`/`−1`, сброс, включить/выключить);
- нужен ли поиск и по каким полям; полнотекстовый (как у заметок) или подстрока;
- связи с другими сущностями (напоминание ↔ счётчик);
- экраны: нужен ли отдельный экран элемента или всё делается в списке (счётчик можно менять прямо в карточке); как удалять (свайп, как у заметок, или иначе);
- бот: команды, кнопки, уведомления — по умолчанию не нужен.

Потом покажи план: модель (поля и индексы), какие шаблоны берёшь, какие экраны и части из раздела 3, новые общие компоненты (если появляются), файлы, которые создашь и изменишь. **Жди подтверждения.**

## 2. Имена

Выбери имена и подставляй их в шаблоны вместо плейсхолдеров:

| Плейсхолдер | Что это | Пример для счётчиков |
|---|---|---|
| `__Entity__` | сущность, PascalCase, единственное число | `Counter` |
| `__Entities__` | PascalCase, множественное | `Counters` |
| `__entity__` | camelCase, единственное | `counter` |
| `__entities__` | camelCase, множественное; это же путь маршрутов и API | `counters` |
| `__ENTITY__` | префикс констант | `COUNTER` |
| `__Title__` | название раздела в меню и шапке | `Счётчики` |
| `__one__` | одна сущность, винительный падеж, для текстов | `счётчик` |

## 3. Готовые части проекта

Перед тем как писать новое — возьми готовое. Модуль берёт только то, что ему нужно. Если то же самое понадобилось второму модулю, а его ещё нет в `ui/` или `lib/reactive/` — вынеси и обобщи (`code.md`, DRY), а не копируй из раздела заметок.

| Нужно модулю | Что использовать | Образец |
|---|---|---|
| Список с поиском | `DebouncedSearch` (`lib/reactive/debounced-search.svelte.ts`): задержка ввода, отмена устаревших запросов, повторы при обрыве связи (`reconnecting`), `initialItems` | `routes/notes/+page.svelte` |
| Мгновенный показ списка при возврате | кеш `RestResource.cachedList` → `initialItems` | `routes/notes/+page.svelte` |
| Состояния экрана | `Loading` (с задержкой и спиннером), `Message` (пусто, ошибка, «ничего не найдено»), `Notice pending` (полоска «Нет связи…» над списком) | `routes/notes/+page.svelte` |
| Удаление свайпом | `ui/layout/SwipeActions` + `confirmDialog(…, { confirmText: 'Да', cancelText: 'Нет', destructive: true })` | `NoteCard.svelte`, `removeNote` в списке заметок |
| Редактор без кнопки «Сохранить» | `Autosave` (`lib/reactive/autosave.svelte.ts`): отложенное сохранение, `flush()` перед уходом, создание при первом сохранении + `goto(адрес записи, { shallow: true, replace: true })` | `NoteEditor.svelte` |
| Кнопки действий | `ui/buttons/Button` (варианты `primary`, `secondary`, `destructive`), `ActionBar` — панель внизу экрана | — |
| Нестандартное действие (`+1`) | метод сервиса в core + эндпоинт + наследник `RestResource` в `lib/api.ts` (см. `templates/api-client.ts.tpl`) | — |
| Диалоги, вибрация, ссылки | `confirmDialog`, `alertDialog`, `haptic`, `openLink` из `lib/telegram.ts` | — |
| «Назад» | `ui/buttons/BackButton` (системная кнопка Telegram) или `PageHeader` с `onback` | любая страница |
| Карточка-ссылка | `ui/layout/Card` | `NoteCard.svelte` |

Список общих компонентов по группам — `ui.md`, раздел «Компоненты».

## 4. Шаги

### Всегда

1. **Модель и миграция** — `templates/prisma-model.prisma.tpl` → `packages/db/prisma/schema.prisma`, обратная связь в `User`. Миграция — по `db.md`: при запущенном Postgres `bun run db:migrate -- --name add___entities__` (с подтверждения пользователя), без него — `prisma migrate diff`; ручной SQL помечается комментарием.
2. **Константы, схема, DTO** (раскладка — `code.md`, «Где что лежит в core»): `templates/core-constants.ts.tpl` → `packages/core/src/constants/__entities__.ts` и вход `./constants/__entities__` в `packages/core/package.json`; `templates/core-schema.ts.tpl` → `packages/core/src/schemas/__entities__/__entity__-input.ts`; `templates/core-types.ts.tpl` → `packages/core/src/__entities__/types.ts`.
3. **Сервис** — `templates/core-service.ts.tpl` → `packages/core/src/__entities__/service.ts`. `assertId` и `ListQuerySchema` — общие, свои не пиши. В `packages/core/src/index.ts` — именованные экспорты только нужного приложениям (`create__Entities__Service`, `__Entity__Dto`, `__Entity__Input`).
4. **Регистрация сервиса** — `apps/web/src/lib/server/services.ts`: `export const __entities__ = create__Entities__Service(db);`
5. **API** — `templates/api-collection.server.ts.tpl` → `apps/web/src/routes/api/__entities__/+server.ts`, `templates/api-item.server.ts.tpl` → `…/api/__entities__/[id]/+server.ts`. Лишние методы (например, `GET` элемента, если нет экрана элемента) не создавай.
6. **Клиент API** — `templates/api-client.ts.tpl` → `apps/web/src/lib/api.ts`.
7. **Пункт меню** — `apps/web/src/lib/constants/sections.ts`: `{ href: resolve('/__entities__'), title: '__Title__', description: '…', icon: '…' }`.
8. **Тесты** — по `tests.md`: `tests/unit/__entities__/` — схема ввода (валидные, невалидные, граничные значения) и чистые функции; `tests/integration/__entities__/service.test.ts` — каждый метод сервиса, чужие записи (`NotFoundError`), неверный id, некорректный ввод. Фабрика `createTest__Entity__` — в `tests/helpers/factories.ts`. Образцы — тесты заметок.
9. **Документация** — `.claude/CLAUDE.md`: «Project status», при необходимости архитектура; новые общие компоненты — в список `ui.md`.

### По плану модуля

10. **Экраны** — из частей раздела 3: список `routes/__entities__/+page.svelte`; если есть экран элемента — `routes/__entities__/[id]/+page.ts` по `templates/item-page.ts.tpl` и `+page.svelte` с `{#key data.__entity__.id}`; создание — `routes/__entities__/new/+page.svelte` или прямо в списке. Компоненты раздела — `lib/components/__entities__/`.
11. **Доп. действия** — метод сервиса, эндпоинт (`POST /api/__entities__/[id]/<действие>` или `PATCH`), метод наследника `RestResource`; если действие меняет запись — обнови и кеш списка.
12. **Поиск** — подстрока (в шаблоне сервиса) или полнотекстовый, как у заметок (`db.md`, generated-колонка `tsvector`).
13. **Бот** — по `bot.md`, «Как добавить команду или раздел»; логика — тот же сервис core, без дублирования.

Перед завершением пройди `checklist.md`.

## 5. Проверка

- `bun run format` — сам.
- Проверки — субагенту `verifier` (CLAUDE.md, раздел Commands): режим `all` (есть и сервер, и Mini App), модуль `__entities__`. Сам линтер и тесты не прогоняй.
- Web-сервер и бота не запускай (они читают `.env`). В конце — список ручных проверок в Telegram и браузере по тому, что сделано: меню → раздел → создание → изменение → удаление → действия модуля → поиск → «Назад» → несуществующий `/__entities__/abc` (если есть экран элемента) → без сети (повторы, полоска «Нет связи») → команды бота (если есть).

Не коммить без подтверждения пользователя.
