---
description: Состояние проекта одним взглядом — git (изменения, незапушенные коммиты), контейнеры Docker, запущены ли бот и web
allowed-tools: Bash(git status *), Bash(git log *), Bash(git rev-parse *), Bash(git fetch *), Bash(docker info *), Bash(docker compose ps *), Bash(pgrep *), Bash(lsof *)
---

Покажи текущее состояние проекта. Ничего не меняй и не запускай.

- **Git**: ветка; изменённые и новые файлы (`git status --short`), сгруппированные по областям (`apps/web`, `apps/bot`, `packages/*`, `tests`, `.claude`, прочее); коммиты, которых нет в `origin/main` (`git log --oneline origin/main..HEAD`), и наоборот — есть ли новые на сервере (только если `git fetch --dry-run` отвечает быстро; без сети — пропусти).
- **Docker**: запущен ли (`docker info`); `docker compose ps -a` — `postgres`, `redis`, `postgres-test` с состоянием. Оставшийся после тестов `postgres-test` — отметь (`/test-db-stop`).
- **Приложения**: бот — `pgrep -fl "env-file=../../.env src/index.ts"`, web — `lsof -nP -iTCP:5173 -sTCP:LISTEN`.

Ответ — компактной таблицей «что — состояние», без вывода команд целиком. В конце — одна строка о том, что разумно сделать (закоммитить, запушить, остановить тестовую БД), если есть что. $ARGUMENTS
