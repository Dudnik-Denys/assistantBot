// Константы __Title__. Файл без зависимостей: его
// импортирует и сервер (схема), и Mini App (maxlength).
export const __ENTITY___TITLE_MAX = 200;

/** Текст ошибки: не заполнено обязательное поле (константы — здесь, не в файле схемы). */
export const __ENTITY___TITLE_REQUIRED_MESSAGE = 'Укажите название';

/** Текст ошибки, когда запись не найдена или чужая (замени на «Счётчик не найден» и т. п.). */
export const __ENTITY___NOT_FOUND_MESSAGE = '__Title__: запись не найдена';

// В packages/core/package.json добавить вход для клиента:
//   "./constants/__entities__": "./src/constants/__entities__.ts"
