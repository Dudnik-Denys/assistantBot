// Константы заметок. Файл без зависимостей: его импортирует и сервер (схема, поиск),
// и Mini App (`maxlength` в редакторе) — через вход `@tgab/core/constants/notes`.

export const NOTE_TITLE_MAX = 200;
export const NOTE_CONTENT_MAX = 20_000;

/** Сколько первых слов запроса участвует в полнотекстовом поиске: длинный запрос не раздувает tsquery. */
export const SEARCH_WORDS_MAX = 10;
