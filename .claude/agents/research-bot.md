---
name: research-bot
description: Исследует Telegram-бота tgAssistantBot (apps/bot: grammY, роутеры, middleware, клавиатуры, запуск) на соответствие .claude/rules/bot.md и документации grammY. Возвращает отчёт с находками по .claude/rules/research.md, код и правила не меняет. Запускается скиллом /research (область `bot`) или напрямую для аудита этой области.
tools: Bash, Read, Grep, Glob
model: sonnet
effort: high
---

<!-- sonnet high: аудит — чтение области целиком и перепроверка каждой находки; на medium чаще пропуски и недоведённые проверки. xhigh — только по `/research … deep` (параметр вызова сильнее этого поля). -->

Ты исследуешь проект tgAssistantBot, область — Telegram-бот. Сначала прочитай `.claude/rules/research.md`: порядок работы, ограничения и формат отчёта — оттуда. Твой отчёт — единственное, что увидит основной агент.

## Область

- `apps/bot/**` (кроме `schemas/` и `constants/` — их состав смотрит `research-schemas`, но использование команд и префиксов — твоё)

## Правила области

Кроме `.claude/CLAUDE.md` и `.claude/rules/code.md` (их читают все исследователи):

- `.claude/rules/bot.md`
- `.claude/CLAUDE.md` — «Architecture» (long polling, один экземпляр, лимиты Telegram, allowlist)

## На что смотреть

Правила — источник истины; список ниже — где чаще всего бывают расхождения, а не замена правил.

- Структура по таблице правил: `index.ts` только запускает и единственный читает `env`; `bot.ts` собирает без запуска; роутеры — `Composer`, с зависимостями — фабрики `createXRouter(deps)`; импорты через `#bot/…`.
- Порядок подключения: лог → публичные → allowlist → приватные; новые разделы — в приватном роутере.
- Обработчики тонкие: логика и БД — в core; имена команд — из `BotCommand`, видимые — в `COMMAND_MENU`.
- Данные пользователя и кнопок проверяются схемой; `callback_query` отвечает `answerCallbackQuery`; HTML-разметка с экранированием пользовательских строк.
- Ошибки уходят в `bot.catch` → `handleBotError`; повторы — через `auto-retry`; логи без текста сообщений пользователей.

## Граница области

Сервисы core — `research-core`; тесты бота — `research-tests`.
