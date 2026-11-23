---
name: backup
description: Бэкапы Postgres tgAssistantBot — настройка на сервере (хранилище, rclone с шифрованием, таймеры systemd, healthchecks.io), проверка актуальности и восстановимости последнего бэкапа, внеплановый бэкап и восстановление после сбоя. Скрипты — deploy/backup.sh и deploy/restore-check.sh, инструкция — на рабочем столе. Вызывается как /backup <setup | check | now | restore>.
argument-hint: "<setup | check | now | restore>"
---

# backup

Бэкапы: `$ARGUMENTS`

Регулярно бэкапы делает **сервер** (таймер systemd), а не Claude: между сессиями Claude не работает. Пропущенный бэкап замечает healthchecks.io и присылает уведомление в Telegram. Этот скилл — настроить, проверить по запросу и восстановить. Ручная часть — `~/Desktop/tgAssistantBot — бэкапы.md`.

Скрипты: `deploy/backup.sh` (дамп → хранилище, хранение 30 дней + ежемесячные 12 месяцев, пинг healthchecks), `deploy/restore-check.sh` (свежесть, восстановление во временный контейнер, сверка числа записей), таймеры — `deploy/systemd/`. Настройки на сервере — `/etc/tgab/backup.env` (600, не в git); его значения и ключи хранилища не читай и не выводи.

Все команды на сервере — по SSH (`ssh deploy@<сервер>`) и только после подтверждения пользователя. Без настроенного сервера (`/deploy-setup`) — скажи об этом.

## setup

1. Проверь, что пользователь прошёл раздел инструкции про хранилище и healthchecks (bucket, ключи, rclone с шифрующим remote, пароль шифрования сохранён вне сервера).
2. На сервере: `rclone` установлен, `rclone lsd <remote>:` отвечает; `/etc/tgab/backup.env` есть (по образцу из инструкции); скрипты в `/opt/tgab/deploy/` исполняемые.
3. Таймеры: скопировать `deploy/systemd/*` в `/etc/systemd/system/`, `systemctl daemon-reload`, `systemctl enable --now tgab-backup.timer tgab-restore-check.timer`; `systemctl list-timers 'tgab-*'` — время следующего запуска.
4. Первый прогон вручную: `sudo systemctl start tgab-backup.service`, затем `tgab-restore-check.service`; `journalctl -u tgab-backup -n 30`. Проверка в healthchecks.io стала зелёной.

## check

По запросу «как там бэкапы»:

1. `systemctl list-timers 'tgab-*'` — таймеры активны, когда был последний и будет следующий запуск.
2. `journalctl -u tgab-backup -u tgab-restore-check --since "8 days ago" | tail` — результаты последних запусков.
3. `rclone lsl <remote>/daily/ | sort -k2,3 | tail -3` — свежесть и размер (резкое уменьшение размера — подозрительно).
4. По желанию — `sudo /opt/tgab/deploy/restore-check.sh` прямо сейчас.

Итог — таблица: последний бэкап (когда, размер), последняя проверка восстановления (когда, результат, числа записей), следующие запуски, проблемы.

## now

Внеплановый бэкап (перед рискованной миграцией, перед выпуском): `sudo systemctl start tgab-backup.service` и результат из журнала.

## restore

Восстановление рабочей базы — **разрушающее** действие. Только по явной просьбе пользователя и после повторного подтверждения с названием бэкапа.

1. Выбрать бэкап (`rclone lsl … daily/ monthly/`), показать дату — что будет потеряно (всё после неё).
2. Сделать бэкап текущего состояния (`now`), даже если база повреждена.
3. Остановить приложения (`docker compose stop web bot worker`), оставить `postgres`.
4. Скачать дамп, `pg_restore --clean --if-exists --no-owner -d <база>` внутри контейнера postgres.
5. Поднять приложения (`up -d`; `migrate` догонит схему, если бэкап старее последних миграций), проверить `/healthz` и попросить пользователя открыть Mini App.

Порядок — как в разделе «Восстановление после сбоя» инструкции; если что-то пошло не так — остановись и опиши состояние, не импровизируй с базой.
