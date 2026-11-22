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
