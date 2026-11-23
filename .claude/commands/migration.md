---
description: Новая миграция Prisma по изменениям schema.prisma — создать, проверить SQL по db.md, применить после подтверждения
argument-hint: "<имя_миграции, например add_counters>"
allowed-tools: Bash(git diff *), Bash(git status *), Bash(docker compose ps *), Bash(bun run db:migrate *), Bash(bun run db:deploy), Bash(bunx prisma *)
---

Создай миграцию Prisma: `$ARGUMENTS`

Правила — `.claude/rules/db.md` (разделы «Модели» и «Миграции»), прочитай перед началом.

1. **Имя**: snake_case по смыслу (`add_counters`, `note_title_required`). Нет имени — предложи по изменениям схемы и спроси.
2. **Есть что мигрировать?** `git diff packages/db/prisma/schema.prisma`. Изменений нет — скажи и остановись. Сверь изменения с разделом «Модели» `db.md` (uuid(7), `userId` + `onDelete: Cascade` + индекс, `Timestamptz(3)`, значения по умолчанию предметной области — не в `@default`); нарушения — до создания миграции.
3. **Создать, не применяя**: Postgres поднят (`docker compose ps postgres`) — `bun run db:migrate -- --name <имя> --create-only`. Без Postgres — `bunx prisma migrate diff` (команда из `db.md`) в `prisma/migrations/<UTC YYYYMMDDHHMMSS>_<имя>/migration.sql`.
4. **Проверить SQL**: покажи его пользователю. Если в нём `DROP` (таблицы, колонки, `DEFAULT`), смена типа или `NOT NULL` на колонке с данными — объясни последствия и **дождись подтверждения**; для `NOT NULL` нужен ли backfill (`UPDATE … SET …` перед ограничением). Generated-колонки (`tsvector`) Prisma не умеет — ручная правка с комментарием `-- Изменено вручную: …`, выражение — как в `dbgenerated(...)` схемы.
5. **Применить** после подтверждения: `bun run db:deploy`. Затем — `verifier` в режиме `integration` (модель `haiku`), чтобы тесты прошли на новой схеме.
6. Применённые миграции не правятся: исправление — только новой миграцией.
