---
description: Полная проверка серверной части перед коммитом (линтер, типы, unit- и интеграционные тесты, ревью по правилам) — packages/core, packages/db, бот, API SvelteKit
allowed-tools: Bash(bun run *), Bash(bun --filter *), Bash(docker compose *), Bash(bunx biome *), Bash(git status *), Bash(git diff *)
---

Прогони проверки серверной части проекта. Область: `packages/core`, `packages/db`, `apps/bot` и серверный код `apps/web` (`hooks.server.ts`, `src/env.ts`, `src/lib/server/`, `src/routes/api/`).

Выполни по очереди, не останавливаясь на первой ошибке — нужен полный список проблем:

1. Линтер и формат: `bunx biome check packages apps/bot apps/web/src/hooks.server.ts apps/web/src/env.ts apps/web/src/lib/server apps/web/src/routes/api tests`
2. Типы пакетов, бота и тестов: `bun --filter @tgab/core check`, `bun --filter @tgab/db check`, `bun --filter @tgab/bot check`, `bun --filter @tgab/tests check`
3. Типы web, включая серверный код: `bun --filter @tgab/web check`
4. Unit-тесты: `bun run test:unit`
5. Интеграционные тесты: `bun run test:integration` (сам поднимет контейнер `postgres-test`; если Docker не запущен — отметь шаг как ❌ с этой причиной)

Затем:

- Покажи итог таблицей: шаг — ✅ / ❌ — короткая причина.
- Для каждой ошибки — файл и строка (`путь:строка`), текст ошибки и предлагаемое исправление.
- Для изменённых файлов `packages/core` сверь код с `.claude/rules/core.md` (и `db.md` для запросов к БД), для серверного кода `apps/web` — с `.claude/rules/api.md`: тонкие эндпоинты, `requireUser` и `user.id`, ошибки только через `errorResponse` и `ERROR_STATUSES`, секреты не уходят клиенту. Найденное — отдельным списком.
- Для изменённых файлов `apps/bot` сверь код с `.claude/rules/bot.md`: структура папок, имена команд только из `BotCommand`, порядок роутеров (публичные → allowlist → для своих), тонкие обработчики, зависимости через `deps` (не `env` внутри роутеров), импорты через `#bot/…`. Нарушения — в отчёт.
- Посмотри `git status` и `git diff`: если изменён серверный код, для которого нет тестов в `tests/unit/<модуль>/` или `tests/integration/<модуль>/`, скажи об этом и предложи, какие тесты добавить (по `.claude/rules/tests.md`). Отдельно отметь, что тестов эндпоинтов `routes/api` в проекте пока нет.

Ничего не исправляй и не коммить без моего подтверждения — только отчёт и предложения. $ARGUMENTS
