/**
 * Часовой пояс нового пользователя (IANA). Единственный источник: в БД значения по умолчанию нет.
 */
export const DEFAULT_TIMEZONE = 'Europe/Kyiv';

/** Текст ошибки, когда пользователя нет (удалён из allowlist между запросами). */
export const USER_NOT_FOUND_MESSAGE = 'Пользователь не найден';
