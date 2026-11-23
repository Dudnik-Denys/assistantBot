---
paths:
  - apps/web/src/routes/api/**
  - apps/web/src/lib/server/**
  - apps/web/src/hooks.server.ts
  - apps/web/src/**/*.server.ts
  - apps/web/src/lib/http/**
  - apps/web/src/lib/api.ts
  - apps/web/src/lib/errors.ts
  - apps/web/src/lib/schemas/api-error.ts
  - apps/web/src/env.ts
---

# API Mini App: сервер и HTTP

Серверная часть SvelteKit — это API Mini App (`/api/*`), а клиентская — SPA (CLAUDE.md, «Детали каркаса»). Общие правила SvelteKit — в `svelte.md`, принципы кода — в `code.md`, логика — в `core.md`.

## Где серверный код

- Только в `src/lib/server/`, `hooks.server.ts`, `+server.ts` и модулях `*.server.ts` (серверный файл в общей папке — `constants/error-statuses.server.ts`). Клиентский код его не импортирует: SvelteKit запрещает импорт `lib/server` и `*.server.ts` в браузер (ошибка сборки `server_only_import`) — не обходи это.
- Переменные окружения объявляются в `src/env.ts` (`defineEnvVars`, в `schema` — zod-схемы; общие `optionalEnv` и `TelegramIdSchema` — из `@tgab/core/env`) и импортируются из `$app/env/private`; секреты — никогда в клиентский код и в ответы API.

## Доступ

- Каждый запрос к `/api/*` проходит хук `authorizeApi` (`hooks.server.ts` → `authenticateRequest` в `lib/server/auth.ts`): подпись `initData` из заголовка `Authorization: tma <initData>`, пользователь из allowlist кладётся в `locals.user`. Новый эндпоинт под `/api/` защищён автоматически — не обходи хук и не заводи API вне `/api/`.
- Эндпоинт берёт пользователя только через `requireUser(locals)` и передаёт в сервис `user.id`: данные чужого пользователя недоступны по построению.
- Вход без `initData` от имени `DEV_TELEGRAM_ID` — только при `dev` (`vite dev`); в продакшене такого пути нет.

## Эндпоинты

- `+server.ts` тонкие: `requireUser`, вызов сервиса из `packages/core`, `Response.json(...)`, всё обёрнуто в `handleApi`. Тело запроса передаётся в сервис как есть (`await readJson(request)`, тип `unknown`) — проверяет его схема в сервисе; `as XInput` не пишется.
- REST-соглашение (его же ждёт клиент `RestResource`): `GET /<раздел>?q=` — список (сервер принимает и `limit`, клиент его пока не передаёт), `GET /<раздел>/:id` — элемент, `POST /<раздел>` — создание (`201`), `PUT /<раздел>/:id` — изменение, `DELETE /<раздел>/:id` — удаление (`204` без тела). Коды — только `HttpStatus`.
- Действие над записью, которое не укладывается в CRUD (`+1`, «Продолжить», «прочитано»), — `POST /<раздел>/:id/<действие>`: действие — глагол (`increment`, `restart`, `read`), отдельная папка `routes/api/<раздел>/[id]/<действие>/+server.ts` с одним `POST`. Ответ — `200` и DTO изменённой записи, чтобы клиент сразу обновил экран и кеш списка. Тело — только если действию нужны параметры (тогда, как обычно, `readJson` и схема в сервисе). Чтение не меняет данных: отметка «прочитано» — отдельное действие, а не побочный эффект `GET`.
- Хелпер `json` из `@sveltejs/kit` устарел (`@deprecated`) — не использовать.

## Ошибки → HTTP

- Ошибка превращается в HTTP-ответ `{ error, ...details }` только в `errorResponse` (`lib/server/http.ts`; его вызывают `handleApi` и хуки) по таблице `ERROR_STATUSES` (`lib/constants/error-statuses.server.ts`). Новая доменная ошибка — строка в таблице, а не новый `if`.
- Не собирай `Response.json({ error }, …)` вручную — выбрасывай `HttpStatusError` (с `details` для доп. полей) или доменную ошибку core. Неизвестная ошибка пробрасывается дальше: SvelteKit ответит 500 и запишет её в лог.

## Клиент API (браузер)

- Запросы — только через `api` (`lib/api.ts`): новый раздел — строка `<раздел>: new RestResource<Dto, Input>(http, '/<раздел>')`; коллекция, которую клиент не создаёт и не изменяет (записи создаёт сервер — уведомления), — `ReadResource<Dto>` (`lib/http/read-resource.ts`: список, элемент, удаление), без лишних `create` и `update`; нестандартные действия — методы наследника (`CountersApi`), через тот же `HttpClient`: ответ действия кладётся в кеш списка через `cacheItem`. Список отсортирован по времени создания, а не изменения — `{ stableOrder: true }`: изменённая запись остаётся в кеше на своём месте.
- `HttpClient` (`lib/http/client.ts`) различает три вида сбоя: `ApiError` — ответил наш API (текст для пользователя — от сервера), `ServerUnavailableError` — ответил не наш API (туннель, прокси), `NetworkError` — ответа нет. Тело ошибки проверяется схемой `ApiErrorBodySchema`, а не приведением типа.
- Текст ошибки для пользователя — только `errorMessage` (`lib/errors.ts`): известные ошибки несут готовый текст, неожиданные — общий текст и подробности в консоль. Повторять ли запрос — `isConnectionError`.
