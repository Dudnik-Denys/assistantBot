import { z } from 'zod';

/** Часовой пояс нового пользователя (IANA). Единственный источник: в БД значения по умолчанию нет. */
export const DEFAULT_TIMEZONE = 'Europe/Kyiv';

/**
 * Пользователь Telegram из initData Mini App (https://core.telegram.org/bots/webapps#webappuser).
 * Берём только нужные поля; остальные (`is_premium`, `photo_url`…) отбрасываются.
 */
export const TelegramUserSchema = z.object({
	id: z.number().int().positive(),
	first_name: z.string().optional(),
	last_name: z.string().optional(),
	username: z.string().optional(),
	language_code: z.string().optional(),
});

export type TelegramUser = z.infer<typeof TelegramUserSchema>;

/**
 * Поля пользователя Telegram, нужные для входа; есть и в initData, и в апдейтах бота (`ctx.from`),
 * поэтому `toTelegramIdentity` принимает оба.
 */
export type TelegramUserFields = Pick<TelegramUser, 'id' | 'first_name' | 'username'>;

/** Кто входит: telegramId и профиль, который обновляется при каждом входе. */
export interface TelegramIdentity {
	telegramId: bigint;
	firstName?: string | null;
	username?: string | null;
}

/**
 * Текущий (вошедший) пользователь в ответе API (`GET /api/user`).
 * telegramId — строка: bigint не сериализуется в JSON.
 */
export interface UserDto {
	id: string;
	telegramId: string;
	firstName: string | null;
	isAdmin: boolean;
	timezone: string;
}
