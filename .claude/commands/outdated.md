---
description: Устаревшие зависимости во всех пакетах монорепо и расхождения версий одной зависимости между пакетами (ничего не обновляет)
allowed-tools: Bash(bun outdated *), Bash(bun --version), Bash(git ls-files *), Bash(grep *)
---

Проверь зависимости. **Ничего не устанавливай и не обновляй** — только отчёт.

1. **Устаревшие**: `bun outdated --filter '*'` из корня (если флаг не поддерживается — `bun outdated` в корне и `--cwd` каждого пакета: `apps/web`, `apps/bot`, `packages/core`, `packages/db`, `tests`).
2. **Расхождения**: одна зависимость с разными версиями в разных `package.json` (`typescript`, `zod`, `@types/bun`, `prisma` и `@prisma/*` и т. п.), версия Bun в `.github/workflows/ci.yml` против `bun --version`.
3. **Отчёт** таблицей: пакет — текущая — последняя — где используется — тип обновления (patch / minor / **major**). Отдельно — расхождения версий. Для major-обновлений — одна строка, что может сломаться (по changelog, если знаешь; не выдумывай), и рекомендация: обновлять сейчас или отложить. Группы, которые обновляются только вместе (`prisma` + `@prisma/client` + `@prisma/adapter-pg`, `svelte` + `@sveltejs/*`), — вместе. $ARGUMENTS
