import { SECONDS_PER_DAY, SECONDS_PER_MINUTE } from './time.ts';

/** Сколько живут initData Mini App: старше — отклоняются (защита от повторного использования). */
export const INIT_DATA_MAX_AGE_SECONDS = SECONDS_PER_DAY;

/**
 * На сколько `auth_date` может быть в будущем: допуск на расхождение часов Telegram и сервера.
 * Дальше — отклоняется (иначе «возраст» отрицательный, и проверка срока не срабатывает).
 */
export const INIT_DATA_MAX_CLOCK_SKEW_SECONDS = 5 * SECONDS_PER_MINUTE;
