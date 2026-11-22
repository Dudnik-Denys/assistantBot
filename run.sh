#!/usr/bin/env bash
# Запуск проекта для разработки одной командой.
#
#   ./run.sh            # web + bot
#   ./run.sh bot        # только бот
#   ./run.sh web        # только Mini App + API
#
# Делает: проверяет .env и инструменты, запускает Docker (если не запущен),
# поднимает Postgres и Redis, ставит зависимости, применяет миграции,
# стартует выбранные сервисы. Ctrl+C останавливает всё, что запустил скрипт
# (контейнеры БД остаются работать: `docker compose down` — остановить их).
set -euo pipefail
cd "$(dirname "$0")"

services=("$@")
[ ${#services[@]} -eq 0 ] && services=(web bot)
for s in "${services[@]}"; do
	case "$s" in
		web | bot) ;;
		*) echo "Неизвестный сервис: $s (доступны: web, bot)" >&2; exit 1 ;;
	esac
done

step() { printf '\n\033[1;34m▶ %s\033[0m\n' "$*"; }
fail() { printf '\033[1;31m✖ %s\033[0m\n' "$*" >&2; exit 1; }

# --- инструменты -----------------------------------------------------------
command -v bun >/dev/null || fail "Не найден bun: https://bun.sh"
command -v docker >/dev/null || fail "Не найден docker (OrbStack или Docker Desktop)"

# --- .env ------------------------------------------------------------------
if [ ! -f .env ]; then
	fail "Нет файла .env. Создайте его в корне репозитория по разделу «Переменные окружения» в README.md (обязателен BOT_TOKEN) и запустите снова."
fi
env_value() { grep -E "^$1=" .env | tail -1 | cut -d= -f2-; }
[ -n "$(env_value BOT_TOKEN)" ] || fail "В .env не задан BOT_TOKEN"
if [ -z "$(env_value ADMIN_TELEGRAM_ID)" ]; then
	echo "⚠ ADMIN_TELEGRAM_ID не задан: доступа не будет ни у кого."
	echo "  Узнайте свой ID командой /id у бота и впишите его в .env."
fi

# --- Docker ----------------------------------------------------------------
if ! docker info >/dev/null 2>&1; then
	step "Запускаю Docker"
	if [ "$(uname)" = Darwin ]; then
		open -a OrbStack 2>/dev/null || open -a Docker 2>/dev/null || fail "Запустите Docker вручную"
	else
		fail "Docker не запущен"
	fi
	for _ in $(seq 1 60); do docker info >/dev/null 2>&1 && break; sleep 2; done
	docker info >/dev/null 2>&1 || fail "Docker не запустился за 2 минуты"
fi

step "Postgres и Redis"
docker compose up -d --wait

step "Зависимости"
bun install

step "Миграции БД"
bun run db:deploy

# --- сервисы ---------------------------------------------------------------
# При выходе (Ctrl+C, падение) гасим все дочерние процессы скрипта.
cleanup() {
	trap - EXIT INT TERM
	echo
	step "Останавливаю сервисы"
	kill $(jobs -p) 2>/dev/null || true
	wait 2>/dev/null || true
}
trap cleanup EXIT INT TERM

for s in "${services[@]}"; do
	step "Старт: $s"
	bun run "dev:$s" &
done

if [[ " ${services[*]} " == *" web "* ]]; then echo "Mini App: http://localhost:5173"; fi
wait
