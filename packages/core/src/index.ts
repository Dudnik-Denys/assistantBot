// Публичный API пакета: только то, что используют приложения (`apps/*`).
// Внутреннее (схемы ввода, DTO-мапперы, поиск) остаётся в своих модулях.
// Схемы env — отдельный вход `@tgab/core/env`, лимиты для клиента — `@tgab/core/<раздел>/limits`.
export { validateInitData } from './auth/init-data.ts';
export { InitDataError, NotFoundError } from './errors.ts';
export type { NoteDto, NoteInput } from './notes/schema.ts';
export { createNotesService } from './notes/service.ts';
export type { TelegramIdentity, UserDto } from './users/schema.ts';
export {
	createUsersService,
	toTelegramIdentity,
	toUserDto,
	type UsersService,
} from './users/service.ts';
