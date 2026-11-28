// Константы уведомлений раздела «Напоминания». Без внешних зависимостей: вход
// `@tgab/core/constants/notifications` (воркер строит ссылку на экран уведомления).

import { MS_PER_DAY } from './time.ts';

/**
 * Путь экрана уведомления в Mini App относительно её адреса (к нему добавляется id).
 * Должен совпадать с маршрутом `apps/web/src/routes/reminders/notifications/[id]`.
 */
export const NOTIFICATION_SCREEN_PATH = 'reminders/notifications/';

/**
 * Сколько воркер досылает неотправленное уведомление (outbox): старше — уже неактуально
 * (и так видно в Mini App), а повторная постановка в очередь дольше не нужна.
 */
export const NOTIFICATION_RESEND_WINDOW_MS = MS_PER_DAY;

/** Сколько неотправленных уведомлений воркер ставит в очередь за один проход. */
export const NOTIFICATION_RESEND_BATCH_SIZE = 100;

/** Текст ошибки, когда запись не найдена или принадлежит другому пользователю. */
export const NOTIFICATION_NOT_FOUND_MESSAGE = 'Уведомление не найдено';
