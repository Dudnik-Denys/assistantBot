# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

`tgAssistantBot` — Telegram-бот с Mini App для ежедневных рутинных задач. Пользователи — автор, друзья и родственники (закрытый круг, не публичный сервис); у каждого свои данные. Есть каркас монорепо, Mini App с заметками (`apps/web`, `packages/core`, `packages/db`) и минимальный бот (`apps/bot`: `/start`, `/id`, allowlist); остальные функции MVP, воркер и сервис погоды ещё не начаты. Форматирование и линтинг: Biome (всё, кроме `.svelte`) и Prettier с `prettier-plugin-svelte` (только `.svelte`).

## Функции MVP

1. **Счётчики** — создание, `+1`/`−1`, сброс, удаление.
2. **Напоминания** — самостоятельные или привязанные к счётчику, разовые и повторяющиеся.
3. **Заметки** — текст и ссылки, поиск.
4. **Погода** — прогнозы из нескольких API и «предугадывание» самого вероятного прогноза на их основе.
5. **Вакансии** — проверка актуальных вакансий из выбранных источников.

Функции будут добавляться после MVP.

## Стек

| Слой | Выбор |
|---|---|
| Рантайм и пакеты | Bun, монорепо на Bun workspaces |
| Бот | grammY (выбран вместо GramIO из-за зрелости и объёма информации). Структура (роутеры, middleware, клавиатуры) и правила — `.claude/rules/bot.md` |
| Тесты | `bun:test` в общей папке `tests/` (пакет `@tgab/tests`): `unit/`, `integration/`, `e2e/` → папки модулей; интеграционные — на временном Postgres. Правила — `.claude/rules/tests.md` (unit, integration) и `.claude/rules/e2e.md` (Playwright, Page Object); покрыть модуль e2e — скилл `/cover-module <модуль>` |
| Mini App + API | SvelteKit + Svelte 5 (`adapter-node`, серверная часть — это API) + Tailwind CSS v4. Правила вёрстки, дизайн-токены (цвета и размеры — только переменные) и структура компонентов — `.claude/rules/ui.md`; руны и практики Svelte/SvelteKit по официальной документации — `.claude/rules/svelte.md` |
| БД | PostgreSQL + Prisma. Модели, миграции, сырой SQL — `.claude/rules/db.md` |
| Фоновые задачи | BullMQ + Redis |
| Погода | Отдельный сервис на Python: FastAPI, пакеты через uv |
| CI | GitHub Actions (`.github/workflows/ci.yml`: lint, типы, unit- и интеграционные тесты, сборка; e2e — не в CI); Docker-образы в GHCR |
| Хостинг | VPS + Docker Compose; провайдер ещё не выбран, см. раздел «Хостинг» |

## Architecture

Структура монорепо (`apps/worker`, `apps/weather` ещё не созданы):

```
apps/web       # SvelteKit: Mini App + API
apps/bot       # grammY
apps/worker    # BullMQ: напоминания, сбор вакансий и снимков погоды
apps/weather   # Python-сервис предугадывания погоды
packages/core  # общая логика (services) и типы
packages/db    # схема Prisma, миграции, клиент
tests          # тесты всех пакетов: unit/ integration/ e2e/ → папки модулей (.claude/rules/tests.md, e2e.md)
```

Принципы (общие правила кода — DRY, ответственность модулей, ООП/SOLID, именование — в `.claude/rules/code.md`):

- Логика живёт в `packages/core`; хендлеры бота и эндпоинты SvelteKit — тонкие слои над ней.
- Бот и воркер — отдельные процессы, не внутри SvelteKit. Бот получает обновления через long polling (`bot.start()` grammY) и в разработке, и в продакшене: при закрытом круге пользователей webhook не даёт выигрыша, а polling не требует публичного HTTPS-эндпоинта для бота. Переход на webhook (`webhookCallback`) — только при необходимости горизонтального масштабирования; хендлеры от способа получения обновлений не зависят. Polling допускает только один запущенный экземпляр бота на токен.
- Mini App авторизуется проверкой подписи `initData` на сервере.
- У схемы БД один владелец — Prisma на TS-стороне. Python-сервис схему не меняет: получает данные по HTTP или только читает свои таблицы.
- Повторяющиеся напоминания хранятся как данные (модель `Reminder` с правилом повтора и `nextRunAt`); cron-расписание на каждое напоминание не заводится. Источник истины — Postgres, а не Redis: периодическая задача BullMQ (раз в минуту) выбирает наступившие напоминания через `SKIP LOCKED`, ставит отправку в очередь и сдвигает `nextRunAt`. Так потеря или рассинхрон очереди не теряет напоминания.
- Redis для BullMQ: `maxmemory-policy noeviction` (иначе BullMQ теряет ключи) и включённый AOF.
- Многопользовательность: модель `User` с `telegramId` (из `initData` / `ctx.from`) и часовым поясом; все пользовательские сущности имеют `userId`, и каждый запрос в `packages/core` фильтруется по нему — сервисы принимают `userId` явно. Доступ ограничен allowlist'ом `telegramId` (управляет админ — `isAdmin` у автора); незнакомым пользователям бот отказывает.
- Времена хранить в UTC, повторы напоминаний вычислять в часовом поясе пользователя.
- Рассылки учитывают лимиты Telegram (~30 сообщений/с всего, ~1/с в один чат): лимитер очереди BullMQ и `@grammyjs/auto-retry`.
- Полнотекстовый поиск по заметкам (`tsvector`, конфигурация `russian`) и `SKIP LOCKED` делаются сырым SQL через `$queryRaw`.
- Вакансии — предпочитать источники с официальным API или RSS; парсинг HTML хрупкий, а IP дата-центров часто блокируют.

## Хостинг

Все сервисы проекта работают на одном сервере в отдельных контейнерах одного compose-проекта: `web`, `bot`, `worker`, `weather`, `postgres`, `redis` и разовый `migrate` (`prisma migrate deploy` перед стартом остальных, через `depends_on: condition: service_completed_successfully`). Наружу доступен только `web`, остальные — только во внутренней сети compose. У всех сервисов `restart: unless-stopped`. Целевая архитектура — x86 (amd64).

VPS берётся, когда проект готов к запуску в compose; до этого всё разрабатывается локально. Провайдер не выбран:

- **Hetzner Cloud** — общий x86 vCPU (линейка CX), Германия или Финляндия, включённые Backups. Самый дешёвый вариант за эти ресурсы.
- **Украинский провайдер**, например Mirohost Cloud (тариф Flex), дата-центр в Польше предпочтительнее украинского. Перед заказом сравнить итоговую цену с IPv4 и бэкапами с Hetzner; при заказе может понадобиться верификация аккаунта. eVPS у Mirohost не брать — заметно дороже за те же ресурсы.

Требования к серверу: 2 vCPU / 4 ГБ RAM (8 ГБ или swap, если деплой через Coolify — он занимает 1–2 ГБ), 40–60 ГБ NVMe, выделенный IPv4, Ubuntu 24.04 LTS, автоматические бэкапы. Деплой — Coolify/Dokploy или Caddy + SSH, ещё не выбрано. HTTPS — Let's Encrypt через Caddy/Traefik.

- Нужен домен (дешёвый, DNS в Cloudflare); Mini App — на поддомене. Shared-хостинг не подходит.
- SSH только по ключам, `ufw`, `unattended-upgrades`.
- Мониторинг доступности (healthchecks.io или Uptime Kuma) с уведомлениями в Telegram.
- На том же сервере можно держать другие проекты: у каждого свой compose и своя сеть, общий reverse proxy маршрутизирует по домену, лимиты памяти на контейнеры.

## Commands

```bash
./run.sh                     # всё сразу: Docker, БД, bun install, миграции, web + bot
bun install                  # зависимости + prisma generate (postinstall)
docker compose up -d         # Postgres и Redis для разработки
bun run db:deploy            # применить миграции; db:migrate — создать новую (prisma migrate dev)
bun run user:allow <tgId>    # добавить пользователя в allowlist (--admin — сделать админом)
bun run dev                  # все приложения apps/* вместе: web (http://localhost:5173) + бот (long polling); по отдельности не запускаются
bun run check                # типы во всех пакетах (tsc / svelte-check)
bun run test:unit [модуль]   # unit-тесты (tests/unit/<модуль>); -t "текст" — по описанию теста
bun run test:integration [модуль]  # интеграционные: сами поднимут временный Postgres (tests/integration)
bun run lint                 # проверка: Biome (TS, JSON, CSS) + Prettier --check (.svelte)
bun run format               # автоисправление: форматирование, безопасные фиксы Biome, порядок импортов
bun run build:web && bun --cwd apps/web start   # продакшен-сборка web
```

Проверки после изменений (линтер, типы, тесты, `verify-server` / `verify-ui`) основной агент сам не прогоняет — поручает их субагенту `verifier` (`.claude/agents/verifier.md`), указывая режим (`server`, `ui`, `all`, `unit`, `integration`) и при необходимости модуль; в основной контекст возвращается только короткий отчёт. Модель: для `unit` и `integration` — вызывать с `model: haiku` (механический прогон и пересказ вывода), для `server`, `ui`, `all` — модель по умолчанию из файла субагента (`sonnet`): там есть ревью кода по правилам. `bun run format` запускает основной агент — субагент файлы не меняет.

Аудит проекта на соответствие правилам и этому файлу — скилл `/research [области…] [changed]`: параллельно запускает агентов-исследователей `research-*` (`.claude/agents/`, по одному на область: `docs`, `tests`, `e2e`, `db`, `schemas`, `core`, `bot`, `ui`, `api`, `web`, `tooling`) и сводит их находки в один отчёт. Без аргументов скилл ничего не запускает, а предлагает выбрать области; больше трёх агентов (в том числе `all`) — только после подтверждения: подписка Pro, полный прогон съедает большую часть 5-часового лимита. Обычный режим — `changed`. Общий протокол исследователей — `.claude/rules/research.md`. В отличие от `verifier`, исследователи не запускают проверки, а читают код области целиком и ищут то, что инструменты не ловят: расположение файлов, дублирование, устаревшие правила, пробелы в тестах. Код они не меняют.

Детали каркаса:

- SvelteKit 3: конфиг kit — в `vite.config.ts` (`svelte.config.js` нет); алиас `#lib/*` (а не `$lib`) с явным расширением: `#lib/api.ts`, `#lib/components/X.svelte`. Env-переменные объявляются в `apps/web/src/env.ts` (`defineEnvVars`) и импортируются из `$app/env/private`; `.env` читается из корня монорепо (`env.dir`).
- Mini App — SPA (`ssr = false`): данные требуют `initData`, которые есть только в браузере. API — `/api/*`, авторизация — хук в `hooks.server.ts`, логика в `lib/server/auth.ts` (`authenticateRequest`), заголовок `Authorization: tma <initData>` (схема — `TMA_AUTH_SCHEME` в `lib/constants/auth.ts`). В `vite dev` при заданном `DEV_TELEGRAM_ID` запросы без заголовка идут от имени этого пользователя — можно открыть приложение в обычном браузере.
- Бот: `apps/bot/src/index.ts` только запускает, `bot.ts` (`createBot(deps)`) собирает middleware и роутеры (`Composer` grammY) по папкам `middlewares/`, `routers/`, `keyboards/`, `constants/`; алиас `#bot/*` с явным расширением; env — zod-схема в `env.ts`. Подробно — `.claude/rules/bot.md`.
- Prisma 7: генератор `prisma-client` в `packages/db/src/generated` (не в git), подключение через `@prisma/adapter-pg`, конфиг — `packages/db/prisma.config.ts`.
- `Note.search` — generated-колонка `tsvector`, выражение дописано в миграцию вручную; в схеме оно продублировано в `@default(dbgenerated(...))` ровно в том виде, как его интроспектирует Prisma, иначе `migrate dev` создаёт миграцию `DROP DEFAULT`. Поиск — только по заголовку (он обязателен): `to_tsquery` с префиксами слов плюс `ILIKE` по подстроке.

## Окружение

- Разработка ведётся на macOS (Apple Silicon, arm64) и на домашнем ПК; код синхронизируется через git, `.env` на каждой машине свой (переменные описаны в `README.md`, раздел «Переменные окружения»; локальный `.env.example` в git не входит). Новая переменная окружения — сразу в таблицу README (и в `apps/web/src/env.ts` или `apps/bot/src/env.ts`, где она читается). На маке Docker — через OrbStack (или Docker Desktop).
- Локально Postgres и Redis запускаются в контейнерах через `docker compose`, а `web`, `bot`, `worker` — напрямую через `bun` (hot reload), сервис погоды — через `uv run`. Полный compose со всеми сервисами — для проверки перед деплоем.
- Продакшен-образы собираются под amd64 в GitHub Actions, а не на маке; локальная сборка x86-образа — `docker buildx --platform linux/amd64`.
- Для разработки нужен отдельный бот (второй токен от BotFather) и HTTPS-туннель (`cloudflared` или ngrok) для локального открытия Mini App.
- Секреты (токены, API-ключи, `DATABASE_URL`, `REDIS_URL`) — только в env и GitHub Secrets, не в репозитории.
- Нужны ежедневные бэкапы Postgres (`pg_dump` в S3-совместимое хранилище).
