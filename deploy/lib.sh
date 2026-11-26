#!/usr/bin/env bash
# Общее для backup.sh и restore-check.sh: подключается через `. "$(dirname "$0")/lib.sh"`.
# Читает настройки (/etc/tgab/backup.env или $BACKUP_CONFIG), подставляет значения по умолчанию
# и проверяет обязательные; даёт pg_compose (команда в контейнере Postgres из compose)
# и hc_ping (сигнал healthchecks.io).

CONFIG="${BACKUP_CONFIG:-/etc/tgab/backup.env}"
# shellcheck source=/dev/null
. "$CONFIG"

: "${COMPOSE_DIR:=/opt/tgab}" "${COMPOSE_FILE:=docker-compose.prod.yml}" "${PG_SERVICE:=postgres}"
: "${PG_USER:?PG_USER не задан в $CONFIG}" "${PG_DB:?PG_DB не задан в $CONFIG}"
: "${RCLONE_REMOTE:?RCLONE_REMOTE не задан в $CONFIG}"

# Команда в работающем контейнере Postgres (без TTY — вывод можно перенаправлять в файл).
pg_compose() { docker compose -f "$COMPOSE_DIR/$COMPOSE_FILE" exec -T "$PG_SERVICE" "$@"; }

# Образ работающего Postgres: временный контейнер проверки — той же версии, что рабочая база.
pg_image() {
	docker inspect --format '{{.Config.Image}}' \
		"$(docker compose -f "$COMPOSE_DIR/$COMPOSE_FILE" ps -q "$PG_SERVICE")"
}

# healthchecks.io: $1 — адрес проверки (пусто — не отправлять), $2 — /start, /fail или пусто.
hc_ping() { [ -z "$1" ] || curl -fsS -m 10 --retry 3 -o /dev/null "$1$2" || true; }
