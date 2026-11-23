// Константы уведомлений раздела «Напоминания». Без зависимостей: вход
// `@tgab/core/constants/notifications` (воркер строит ссылку на экран уведомления).

/**
 * Путь экрана уведомления в Mini App относительно её адреса (к нему добавляется id).
 * Должен совпадать с маршрутом `apps/web/src/routes/reminders/notifications/[id]`.
 */
export const NOTIFICATION_SCREEN_PATH = 'reminders/notifications/';

/**
 * Сколько воркер досылает неотправленное уведомление (outbox): старше — уже неактуально
 * (и так видно в Mini App), а повторная постановка в очередь дольше не нужна.
 */
export const NOTIFICATION_RESEND_WINDOW_MS = 86_400_000;

/** Сколько неотправленных уведомлений воркер ставит в очередь за один проход. */
export const NOTIFICATION_RESEND_BATCH_SIZE = 100;
