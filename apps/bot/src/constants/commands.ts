/** Команды бота. Имя — без `/`, как его ждут `bot.command()` и `setMyCommands`. */
export const BotCommand = {
	Start: 'start',
	Id: 'id',
} as const;

/** Меню команд в Telegram (кнопка «Меню» рядом с полем ввода). */
export const COMMAND_MENU = [
	{ command: BotCommand.Start, description: 'Начало работы' },
	{ command: BotCommand.Id, description: 'Показать мой Telegram ID' },
];
