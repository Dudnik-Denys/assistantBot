#!/usr/bin/env bash
# Проверка, что последний бэкап восстанавливается: скачивает свежий дамп, поднимает временный
# Postgres в отдельном контейнере, восстанавливает дамп и сравнивает число записей с рабочей базой.
# Рабочую базу только читает. Запуск на сервере по таймеру (раз в неделю) или вручную:
#   sudo /opt/tgab/deploy/restore-check.sh
# Настройки — те же, что у backup.sh (/etc/tgab/backup.env); адрес проверки — HC_RESTORE_URL.
set -euo pipefail

CONFIG="${BACKUP_CONFIG:-/etc/tgab/backup.env}"
# shellcheck source=/dev/null
. "$CONFIG"

: "${COMPOSE_DIR:=/opt/tgab}" "${COMPOSE_FILE:=docker-compose.prod.yml}" "${PG_SERVICE:=postgres}"
: "${HC_RESTORE_URL:=}" "${MAX_AGE_HOURS:=26}"
: "${PG_USER:?}" "${PG_DB:?}" "${RCLONE_REMOTE:?}"

hc_ping() { [ -z "$HC_RESTORE_URL" ] || curl -fsS -m 10 --retry 3 -o /dev/null "$HC_RESTORE_URL$1" || true; }
fail() { echo "✖ $*" >&2; hc_ping /fail; exit 1; }

PG_IMAGE="postgres:17-alpine"
container="tgab-restore-check-$$"
work="$(mktemp -d)"
cleanup() { docker rm -f "$container" >/dev/null 2>&1 || true; rm -rf "$work"; }
trap cleanup EXIT

hc_ping /start

latest="$(rclone lsf "$RCLONE_REMOTE/daily/" --include 'tgab-*.dump' | sort | tail -1)"
[ -n "$latest" ] || fail "В $RCLONE_REMOTE/daily/ нет бэкапов"

# Свежесть: время из имени tgab-YYYY-MM-DDTHHMMZ.dump.
stamp="${latest#tgab-}"; stamp="${stamp%Z.dump}"
backup_epoch="$(date -u -d "${stamp:0:10} ${stamp:11:2}:${stamp:13:2}" +%s)"
age_hours=$(( ($(date -u +%s) - backup_epoch) / 3600 ))
[ "$age_hours" -le "$MAX_AGE_HOURS" ] || fail "Последний бэкап $latest старше ${MAX_AGE_HOURS} ч (${age_hours} ч)"

rclone copy "$RCLONE_REMOTE/daily/$latest" "$work/"

docker run -d --name "$container" -e POSTGRES_PASSWORD=check -e POSTGRES_DB=check \
	-v "$work:/backup:ro" "$PG_IMAGE" >/dev/null
for _ in $(seq 1 30); do
	docker exec "$container" pg_isready -U postgres -d check >/dev/null 2>&1 && break
	sleep 1
done
docker exec "$container" pg_restore -U postgres -d check --no-owner --no-acl "/backup/$latest" \
	|| fail "pg_restore завершился с ошибкой"

count() { # $1 — таблица; $2 — откуда: restored | prod
	local sql="SELECT count(*) FROM \"$1\""
	if [ "$2" = restored ]; then
		docker exec "$container" psql -U postgres -d check -tAc "$sql"
	else
		docker compose -f "$COMPOSE_DIR/$COMPOSE_FILE" exec -T "$PG_SERVICE" \
			psql -U "$PG_USER" -d "$PG_DB" -tAc "$sql"
	fi
}

report="Бэкап $latest (${age_hours} ч назад) восстановлен."
for table in User Note; do
	restored="$(count "$table" restored)"
	prod="$(count "$table" prod)"
	report+=" $table: $restored в бэкапе / $prod сейчас."
	# Бэкап меньше рабочей базы — нормально (записи после бэкапа); заметно больше — подозрительно.
	[ "$restored" -le $(( prod + prod / 10 + 5 )) ] || fail "$table: в бэкапе $restored, сейчас $prod"
done

echo "OK: $report"
hc_ping ""
