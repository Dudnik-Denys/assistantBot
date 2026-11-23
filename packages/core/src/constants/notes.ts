// Константы заметок. Файл без зависимостей: его импортирует и сервер (схема, поиск),
// и Mini App (`maxlength` в редакторе) — через вход `@tgab/core/constants/notes`.

export const NOTE_TITLE_MAX = 200;
export const NOTE_CONTENT_MAX = 20_000;

/** Текст ошибки: заметка без заголовка (заголовок обязателен — по нему идёт поиск). */
export const NOTE_TITLE_REQUIRED_MESSAGE = 'Укажите заголовок';

/**
 * Сколько первых слов запроса участвует в полнотекстовом
 * поиске: длинный запрос не раздувает tsquery.
 */
export const SEARCH_WORDS_MAX = 10;
