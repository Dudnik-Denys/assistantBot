---
description: Запуск бота вместе с Mini App (web) в фоне — с проверками, что бот ещё не запущен и Postgres поднят
allowed-tools: Bash(docker compose ps *), Bash(docker compose up *), Bash(docker info *), Bash(pgrep *), Bash(lsof *), Bash(bun run dev)
---

Запусти бота и Mini App для разработки (`bun run dev` — все `apps/*`). По отдельности они не запускаются.

1. **Уже запущено?** `pgrep -fl "env-file=../../.env src/index.ts"` (бот) и `lsof -nP -iTCP:5173 -sTCP:LISTEN` (web). Если что-то из этого уже работает — не запускай второй экземпляр (long polling допускает только один бот на токен: второй получит ошибку 409). Сообщи, что запущено, и предложи `/dev-stop`.
2. **Docker и Postgres.** `docker info` не отвечает — не запускай Docker сам, а предложи `./run.sh` (он запустит Docker, поставит зависимости и применит миграции). Docker есть — `docker compose ps postgres redis`; если не `healthy` — `docker compose up -d --wait postgres redis`.
3. **Запуск.** `bun run dev` в фоне (`run_in_background`), из корня репозитория. Дождись в выводе двух строк: «Бот @… запущен» и адреса `localhost:5173` (до ~60 с). Не жди дольше и не опрашивай вывод в цикле — используй ожидание по условию.
4. **Итог** одной-двумя строками: бот `@имя` запущен, Mini App — `http://localhost:5173`. Напомни, что HTTPS-туннель (ngrok) пользователь запускает сам. Если в выводе ошибка (env, порт занят, 409) — покажи её строку и что сделать.

Не читай `.env`. Миграции и `bun install` не запускай — это `./run.sh`. $ARGUMENTS
