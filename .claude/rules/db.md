---
paths:
  - packages/db/**
  - packages/core/src/**
  - tests/**
---

# База данных (Prisma, `packages/db`)

Общие принципы кода — в `code.md`. У схемы БД один владелец — Prisma в этом пакете (см. CLAUDE.md): Python-сервис схему не меняет.

## Что где лежит

| Путь | Что |
|---|---|
| `prisma/schema.prisma` | Модели. Комментарии `///` — для неочевидных полей и ручного SQL |
| `prisma/migrations/` | Миграции; применённые не редактируются (см. ниже) |
| `prisma.config.ts` | Конфиг Prisma CLI: путь к схеме и миграциям, `DATABASE_URL` |
| `src/index.ts` | Публичный API пакета: `createPrismaClient`, `Prisma` (для `Prisma.sql`), типы моделей и `PrismaClient` |
| `src/generated/` | Клиент, который создаёт `prisma generate`; не в git, руками не править |

## Модели

- `id` — `String @id @default(uuid(7)) @db.Uuid`; формат id в сервисах проверяется `assertId` из `packages/core/src/common/id.ts`.
- Пользовательская сущность: `userId String @db.Uuid` со связью `onDelete: Cascade` и обратной связью в `User`; индекс `@@index([userId, …])` под основной список.
- Даты — `DateTime @db.Timestamptz(3)`: `createdAt @default(now())`, `updatedAt @updatedAt`. Храним в UTC.
- Значения по умолчанию со смыслом предметной области (часовой пояс, лимиты, начальные значения) — константы в `packages/core/src/constants/` (`DEFAULT_TIMEZONE` в `constants/users.ts`); сервис подставляет их при создании, а в схеме `@default` для них нет. Схема Prisma не может сослаться на константу TS, а значение, записанное в двух местах, расходится. `@default` остаётся для технических значений: `uuid(7)`, `now()`, `false`, пустая строка.
- Поле, которое Prisma не поддерживает (`tsvector`), — `Unsupported(...)`; выражение generated-колонки пишется в миграции вручную и повторяется в `@default(dbgenerated(...))` ровно в том виде, как его интроспектирует Prisma (пример — `Note.search`, CLAUDE.md), иначе `migrate dev` создаст лишнюю миграцию.

## Миграции

- Изменение схемы — только новой миграцией (`bun run db:migrate -- --name <что_изменилось>`); применённые миграции не правятся: на других машинах и на сервере они уже выполнены.
- Без запущенного Postgres SQL миграции генерирует сама Prisma: `bunx prisma migrate diff --from-schema <старая схема> --to-schema prisma/schema.prisma --script`; результат кладётся в `prisma/migrations/<YYYYMMDDHHMMSS>_<имя>/migration.sql` (время — UTC). Руками SQL не сочиняется, кроме того, что Prisma не умеет (generated-колонки, триггеры), — такие места помечаются комментарием `-- Изменено вручную: …`.
- Миграция, которая убирает данные или колонку, — только после подтверждения пользователя.

## Доступ к данным и SQL

- Запросы к БД — только в сервисах `packages/core`; приложения получают клиент через `createPrismaClient` и передают его в фабрики сервисов.
- Сырой SQL — только `db.$queryRaw` / `$executeRaw` с шаблонной строкой (tagged template) и фрагменты `Prisma.sql`: подставленные `${…}` уходят в БД параметрами, а не текстом. `$queryRawUnsafe`, `$executeRawUnsafe` и `Prisma.raw` с данными пользователя запрещены. Значение для `LIKE` экранируется (`escapeLike` в `notes/service.ts`), строка для `to_tsquery` строится из слов без спецсимволов (`buildPrefixTsQuery`).
- Оформление сырого SQL. Короткий запрос или фрагмент — в одну строку (`` Prisma.sql`FALSE` ``, `` db.$executeRaw`TRUNCATE …` ``). Многострочный запрос начинается с новой строки после открывающей `` ` ``; каждая строка SQL — с отступом **на один таб глубже** строки с `$queryRaw`, без дополнительных отступов для продолжений (`AND`, `OR` — на том же уровне, что `WHERE`); закрывающая `` `; `` — на отдельной строке с отступом строки с `$queryRaw`. Отступы — только табами: пробелы внутри шаблонной строки Biome не исправляет, а редактор подсвечивает их как ошибочный отступ. Ключевые слова SQL — заглавными, имена в camelCase — в двойных кавычках (`"userId"`, `"createdAt"`). Образец:

```ts
const rows = await db.$queryRaw<NoteRow[]>`
	SELECT id, title, content, "createdAt", "updatedAt"
	FROM "Note"
	WHERE "userId" = ${userId}::uuid
	AND (${ftsMatch} OR title ILIKE ${like})
	ORDER BY ${rank} DESC, "updatedAt" DESC
	LIMIT ${limit}
`;
```
- Наружу из core отдаются DTO (`toXDto`), а не модели Prisma: `bigint` → строка, даты → ISO-строки, внутренние поля не протекают. Модель `User` ходит только внутри серверного кода (`locals.user`, `ctx.user`).

## `src/index.ts`

Экспортирует поимённо: `createPrismaClient`, `Prisma` (значение — ради `Prisma.sql`), типы моделей, нужные снаружи, и `PrismaClient` **только как тип** — клиент создаётся через фабрику с адаптером `pg`, а не `new PrismaClient()`.

Enum'ы схемы (`CounterTimerMode`, `CounterTimerStatus`) отсюда не экспортируются: их значения в коде — константы `as const` в `packages/core/src/constants/` (`COUNTER_TIMER_MODE`, `COUNTER_TIMER_STATUS`) с теми же строками. Одна константа нужна и серверу, и клиенту (через вход `@tgab/core/constants/<модуль>` — без Prisma), а Prisma принимает эти строки как значения enum. Новое значение enum — в схему и в константу вместе; в сыром SQL — параметром с приведением типа: `${COUNTER_TIMER_STATUS.Running}::"CounterTimerStatus"`.

## `prisma.config.ts` — допустимое исключение

- `DATABASE_URL` читается как `process.env.DATABASE_URL ?? ''`, без zod-схемы, — это не ошибка: `prisma generate` (postinstall, CI) должен работать без БД, а при `migrate` Prisma сама сообщает о неверном адресе. `DatabaseUrlSchema` из `@tgab/core/env` здесь не подключить: core зависит от db, получится цикл.
- `.env` загружается через `dotenv`, а не `bun --env-file`, как в боте: CLI Prisma запускается под Node, флаг Bun на него не действует.
