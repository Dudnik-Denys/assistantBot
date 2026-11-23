#!/usr/bin/env bash
# Бэкап Postgres tgAssistantBot в S3-совместимое хранилище (через rclone, обычно — шифрующий remote).
# Запускается на сервере по таймеру systemd (deploy/systemd/tgab-backup.*), вручную — так же:
#   sudo /opt/tgab/deploy/backup.sh
#
# Настройки — /etc/tgab/backup.env (права 600, в git не хранится; пример — в инструкции):
#   COMPOSE_DIR      каталог с docker-compose.prod.yml          (/opt/tgab)
#   COMPOSE_FILE     имя файла compose                         (docker-compose.prod.yml)
#   PG_SERVICE       сервис Postgres в compose                 (postgres)
#   PG_USER, PG_DB   пользователь и база
#   RCLONE_REMOTE    куда класть, например tgab-crypt:backups
#   KEEP_DAYS        сколько дней хранить ежедневные копии      (30)
#   KEEP_MONTHS      сколько месяцев хранить ежемесячные копии  (12)
#   HC_URL           адрес проверки healthchecks.io (необязательно)
set -euo pipefail

CONFIG="${BACKUP_CONFIG:-/etc/tgab/backup.env}"
# shellcheck source=/dev/null
. "$CONFIG"

: "${COMPOSE_DIR:=/opt/tgab}" "${COMPOSE_FILE:=docker-compose.prod.yml}" "${PG_SERVICE:=postgres}"
: "${KEEP_DAYS:=30}" "${KEEP_MONTHS:=12}" "${HC_URL:=}"
: "${PG_USER:?PG_USER не задан в $CONFIG}" "${PG_DB:?PG_DB не задан в $CONFIG}"
: "${RCLONE_REMOTE:?RCLONE_REMOTE не задан в $CONFIG}"

# healthchecks.io: start / успех / ошибка. Без HC_URL — просто ничего не отправляем.
hc_ping() { [ -z "$HC_URL" ] || curl -fsS -m 10 --retry 3 -o /dev/null "$HC_URL$1" || true; }
trap 'hc_ping /fail' ERR

hc_ping /start
stamp="$(date -u +%Y-%m-%dT%H%MZ)"
file="tgab-${stamp}.dump"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

# Формат custom (-Fc): сжат, восстанавливается выборочно через pg_restore.
docker compose -f "$COMPOSE_DIR/$COMPOSE_FILE" exec -T "$PG_SERVICE" \
	pg_dump -U "$PG_USER" -d "$PG_DB" -Fc >"$work/$file"
[ -s "$work/$file" ] || { echo "Пустой дамп" >&2; hc_ping /fail; exit 1; }

rclone copy "$work/$file" "$RCLONE_REMOTE/daily/"
# Первый бэкап месяца — ещё и в monthly: хранится дольше.
if ! rclone lsf "$RCLONE_REMOTE/monthly/" --include "tgab-$(date -u +%Y-%m)-*" | grep -q .; then
	rclone copy "$work/$file" "$RCLONE_REMOTE/monthly/"
fi

rclone delete "$RCLONE_REMOTE/daily/" --min-age "${KEEP_DAYS}d"
rclone delete "$RCLONE_REMOTE/monthly/" --min-age "$((KEEP_MONTHS * 31))d"

echo "OK: $file ($(du -h "$work/$file" | cut -f1)) → $RCLONE_REMOTE"
hc_ping ""
