---
description: Остановить временный Postgres интеграционных тестов (postgres-test), если он остался запущенным
allowed-tools: Bash(docker compose ps *), Bash(docker compose --profile test stop *)
---

Останови контейнер тестовой БД.

1. `docker compose ps -a postgres-test` — не запущен: так и скажи и остановись.
2. `docker compose --profile test stop postgres-test`. Данные в нём в памяти (tmpfs) — после остановки их нет, это ожидаемо. Рабочие `postgres` и `redis` не трогай.
3. Итог одной строкой.
