/** Кто входит: telegramId и профиль, который обновляется при каждом входе. */
export interface TelegramIdentity {
	telegramId: bigint;
	firstName?: string | null;
	username?: string | null;
}

export type { UserDto } from '../schemas/users/user-dto.ts';
