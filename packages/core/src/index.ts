// Публичный API пакета: только то, что используют приложения (`apps/*`).
// Внутреннее (схемы ввода, DTO-мапперы, поиск) остаётся в своих модулях.
// Env (схемы и `parseEnv`) — отдельный вход `@tgab/core/env`, константы
// для клиента — `@tgab/core/constants/<модуль>`.
export { validateInitData } from './auth/init-data.ts';
export { InitDataError, NotFoundError } from './errors.ts';
export { createNotesService } from './notes/service.ts';
export type { NoteDto } from './notes/types.ts';
export type { NoteInput } from './schemas/notes/note-input.ts';
export {
	createUsersService,
	toTelegramIdentity,
	toUserDto,
	type UsersService,
} from './users/service.ts';
export type { TelegramIdentity, UserDto } from './users/types.ts';
