#!/usr/bin/env bash
# Запуск проекта для разработки одной командой: ./run.sh
#
# Проверяет инструменты и наличие .env, запускает Docker (если не запущен), поднимает Postgres
# и Redis, ставит зависимости, применяет миграции и стартует все приложения apps/* (web, bot,
# worker). Переменные .env проверяют сами приложения при старте (zod-схемы env).
# Ctrl+C останавливает приложения; контейнеры БД остаются (`docker compose down` — остановить).
set -euo pipefail
cd "$(dirname "$0")"

step() { printf '\n\033[1;34m▶ %s\033[0m\n' "$*"; }
fail() { printf '\033[1;31m✖ %s\033[0m\n' "$*" >&2; exit 1; }

command -v bun >/dev/null || fail "Не найден bun: https://bun.sh"
command -v docker >/dev/null || fail "Не найден docker (OrbStack или Docker Desktop)"
# Без .env миграции упадут с непонятной ошибкой Prisma раньше, чем приложения проверят env.
[ -f .env ] || fail "Нет файла .env. Создайте его по разделу «Переменные окружения» в README.md."

docker_running() { docker info >/dev/null 2>&1; }

# Docker не запущен — открываем OrbStack или Docker Desktop и ждём до 2 минут (60 × 2 с).
if ! docker_running; then
	step "Запускаю Docker"
	open -a OrbStack 2>/dev/null || open -a Docker 2>/dev/null || fail "Запустите Docker вручную"
	for _ in {1..60}; do docker_running && break; sleep 2; done
	docker_running || fail "Docker не запустился за 2 минуты"
fi

step "Postgres и Redis" && docker compose up -d --wait
step "Зависимости" && bun install
step "Миграции БД" && bun run db:deploy

step "Старт: web + bot + worker"
# exec — скрипт заменяется на bun: сигналы остановки приходят прямо в него, а он гасит приложения.
exec bun run dev
