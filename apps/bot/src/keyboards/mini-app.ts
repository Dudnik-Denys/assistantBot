import { InlineKeyboard } from 'grammy';

/** Кнопка открытия Mini App. */
export function miniAppKeyboard(url: string): InlineKeyboard {
	return new InlineKeyboard().webApp('Открыть приложение', url);
}
