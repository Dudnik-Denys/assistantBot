---
description: Остановка бота и Mini App, запущенных для разработки, с проверкой, что процессов не осталось
allowed-tools: Bash(pgrep *), Bash(pkill *), Bash(lsof *), Bash(kill *)
---

Останови бота и web (Mini App), запущенных через `bun run dev`, `/dev-start` или `./run.sh`.

1. Если они запущены фоновой задачей в этой сессии — останови задачу (TaskStop).
2. Проверь, что не осталось процессов: `pgrep -fl "filter ./apps/\*|env-file=../../.env src/index.ts|vite dev"` и `lsof -nP -iTCP:5173 -sTCP:LISTEN`. Оставшиеся — `pkill -f` по тому же шаблону (только эти процессы, не все `bun`); через пару секунд проверь снова.
3. Итог одной строкой: что остановлено, порт 5173 свободен. Контейнеры Postgres и Redis не трогай — они не мешают и нужны для следующего запуска (остановить — `docker compose stop`). $ARGUMENTS
