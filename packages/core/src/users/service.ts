import type { PrismaClient, User } from '@tgab/db';
import type { UserDto } from './schema.ts';

export function toUserDto(user: User): UserDto {
	return {
		id: user.id,
		telegramId: user.telegramId.toString(),
		firstName: user.firstName,
		isAdmin: user.isAdmin,
		timezone: user.timezone,
	};
}

export interface TelegramIdentity {
	telegramId: bigint;
	firstName?: string | null;
	username?: string | null;
}

export function createUsersService(
	db: PrismaClient,
	opts: { adminTelegramId?: bigint | null } = {},
) {
	return {
		/**
		 * Возвращает пользователя из allowlist или null, если доступа нет.
		 * Админ (ADMIN_TELEGRAM_ID) создаётся автоматически при первом входе.
		 */
		async authenticate(identity: TelegramIdentity): Promise<User | null> {
			const profile = {
				firstName: identity.firstName ?? null,
				username: identity.username ?? null,
			};
			const existing = await db.user.findUnique({ where: { telegramId: identity.telegramId } });
			if (existing) {
				if (existing.firstName !== profile.firstName || existing.username !== profile.username) {
					return db.user.update({ where: { id: existing.id }, data: profile });
				}
				return existing;
			}
			if (opts.adminTelegramId != null && identity.telegramId === opts.adminTelegramId) {
				return db.user.create({
					data: { telegramId: identity.telegramId, isAdmin: true, ...profile },
				});
			}
			return null;
		},

		/**
		 * Добавляет telegramId в allowlist (или обновляет существующего пользователя).
		 * `isAdmin: true` делает админом; без флага права существующего не меняются.
		 */
		async allow(telegramId: bigint, { isAdmin = false } = {}): Promise<User> {
			return db.user.upsert({
				where: { telegramId },
				create: { telegramId, isAdmin },
				update: isAdmin ? { isAdmin } : {},
			});
		},
	};
}

export type UsersService = ReturnType<typeof createUsersService>;
