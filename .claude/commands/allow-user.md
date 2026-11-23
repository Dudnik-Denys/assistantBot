---
description: Добавить пользователя в allowlist по Telegram ID (bun run user:allow), при необходимости — сделать админом
argument-hint: "<telegramId> [--admin]"
allowed-tools: Bash(bun run user:allow *)
---

Добавь пользователя в allowlist: `$ARGUMENTS`

1. Аргумент — Telegram ID (только цифры) и необязательный `--admin`. Нет аргумента или ID не из цифр — ничего не запускай; подскажи, что ID пользователь узнаёт командой `/id` у бота.
2. Выполни `bun run user:allow <telegramId> [--admin]` (скрипт сам подключает `.env`; файл не читай). Нужен запущенный Postgres — при ошибке подключения предложи `docker compose up -d --wait postgres`.
3. Итог одной строкой из вывода скрипта (`OK: <id> (admin: …)`). Напомни, что пользователю достаточно заново открыть Mini App или отправить боту `/start`.
