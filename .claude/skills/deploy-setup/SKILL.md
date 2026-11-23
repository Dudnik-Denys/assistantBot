---
name: deploy-setup
description: Однократная подготовка продакшена tgAssistantBot на VPS — Dockerfile приложений, docker-compose.prod.yml (web, bot, worker, postgres, redis, разовый migrate), Caddy с HTTPS, сборка образов amd64 в GHCR через GitHub Actions, env на сервере, мониторинг доступности и бэкапы. Опирается на deploy/server-setup.sh и инструкцию на рабочем столе. Вызывается как /deploy-setup [шаг].
argument-hint: "[images | compose | caddy | ci | server | monitoring | backups]"
---

# deploy-setup

Подготовь продакшен: `$ARGUMENTS`

Источник требований — `.claude/CLAUDE.md`, разделы «Хостинг», «Окружение», «Architecture». Ручная часть (сервер, домен, DNS, аккаунты) — в инструкции `~/Desktop/tgAssistantBot — настройка сервера.md`; первичная настройка сервера — `deploy/server-setup.sh`. Это делается один раз; регулярный выпуск — `/release`, бэкапы — `/backup`.

## 0. Решения до начала

Спроси и зафиксируй (в `CLAUDE.md`, «Хостинг»), если ещё не решено:

- **Провайдер и сервер** — арендован ли, адрес, пользователь (`deploy`), прошёл ли `server-setup.sh`.
- **Способ деплоя.** Рекомендация для закрытого проекта на 2 vCPU / 4 ГБ — **Caddy + SSH + compose** (без Coolify/Dokploy: они занимают 1–2 ГБ памяти и добавляют слой, который нужно обслуживать). Выбор пользователя — главный.
- **Домен** и поддомен Mini App (`app.<домен>`), DNS в Cloudflare.
- **Хранилище бэкапов** (S3-совместимое) — для `/backup`.

Без арендованного сервера можно сделать шаги 1–4 (всё, что в репозитории), а 5–7 — позже.

## 1. Образы (`images`)

- `apps/web/Dockerfile`, `apps/bot/Dockerfile` (позже `apps/worker/Dockerfile`): многоэтапная сборка на официальном образе Bun (версия — как в CI), `bun install --frozen-lockfile` по workspace, `prisma generate`, сборка web (`adapter-node`), запуск не от root, `NODE_ENV=production`. Контекст — корень монорепо; `.dockerignore` (без `node_modules`, `.env*`, `.git`, `tests`, `.claude`).
- Образ миграций — `migrate`: `prisma migrate deploy` (можно на базе образа web/bot с другой командой).
- Проверь сборку локально под amd64: `docker buildx build --platform linux/amd64 …` (CLAUDE.md, «Окружение»).
- Эндпоинт здоровья web без авторизации (`/healthz` вне `/api/`, отвечает 200 без обращения к данным пользователей) — для Caddy, мониторинга и `/release`. Правило доступа к `/api/*` (`api.md`) не нарушается.

## 2. Compose (`compose`)

`docker-compose.prod.yml` в корне (отдельно от dev `docker-compose.yml`):

- `web`, `bot` (и `worker`) — образы из GHCR по тегу (`${TAG}`), `restart: unless-stopped`, `env_file: .env` на сервере, лимиты памяти, healthcheck.
- `migrate` — разовый, остальные приложения ждут его `depends_on: condition: service_completed_successfully`.
- `postgres:17-alpine` с томом и healthcheck, `redis:7-alpine` с `--appendonly yes --maxmemory-policy noeviction`.
- `caddy` — единственный с опубликованными портами (`80`, `443`). Остальные — только во внутренней сети: **Docker публикует порты в обход ufw**, поэтому `ports:` у postgres, redis, web не пишутся.
- Новые переменные — в README («Переменные окружения») и схемы env.

## 3. Caddy (`caddy`)

`deploy/Caddyfile`: `app.<домен>` → `web:3000`, автоматический HTTPS (Let's Encrypt), сжатие, заголовки безопасности (HSTS). Бот наружу не публикуется (long polling). Если домен проксирует Cloudflare — режим SSL «Full (strict)».

## 4. Сборка в CI (`ci`)

`.github/workflows/release.yml`: по тегу `v*` (или вручную) — сборка образов `linux/amd64` и публикация в GHCR (`ghcr.io/<владелец>/tgab-web:<тег>` и `:sha`), с кешем buildx. Права — `GITHUB_TOKEN` с `packages: write`; секреты сервера в CI не нужны, если деплой — по SSH из `/release`. Существующий `ci.yml` не трогать.

## 5. Сервер (`server`)

По инструкции на рабочем столе: `/opt/tgab` (владелец `deploy`) с `docker-compose.prod.yml`, `deploy/` и `.env` (права 600, заполняет пользователь — значения не читай и не выводи); `docker login ghcr.io` токеном только на чтение пакетов; первый запуск — как в `/release`. Домен и DNS — пользователь.

## 6. Мониторинг (`monitoring`)

Uptime Kuma или healthchecks.io (CLAUDE.md): проверка `https://app.<домен>/healthz` раз в минуту и уведомления в Telegram. Бот проверяется косвенно — через «пульс»: воркер или бот раз в N минут пингует URL проверки healthchecks (если решено — добавить).

## 7. Бэкапы (`backups`)

`/backup setup` — хранилище, таймеры, проверка восстановления.

## Проверка и отчёт

Каждый шаг — с проверкой: образы собираются, `docker compose -f docker-compose.prod.yml config` без ошибок, workflow — `actionlint` (если есть) или чтение глазами, на сервере — `docker compose ps` и `curl -I https://app.<домен>/healthz`. Команды на сервере — по SSH только после подтверждения пользователя, без вывода секретов. В конце — что сделано, что осталось пользователю, ссылки на разделы инструкции. Правило `.claude/rules/deploy.md` (структура прод-конфигов, что можно и нельзя на сервере) — создать на шаге 2 и дополнять.
