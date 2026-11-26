// Публичный API пакета: только то, что используют приложения (`apps/*`).
// Внутреннее (схемы ввода, DTO-мапперы, поиск) остаётся в своих модулях.
// Env (схемы и `parseEnv`) — отдельный вход `@tgab/core/env`, константы
// для клиента — `@tgab/core/constants/<модуль>`.
export { validateInitData } from './auth/init-data.ts';
export { escapeHtml } from './common/html.ts';
export { type CountersService, createCountersService } from './counters/service.ts';
export type { CounterDto } from './counters/types.ts';
export { InitDataError, NotFoundError, ValidationError } from './errors.ts';
export { createNotesService } from './notes/service.ts';
export type { NoteDto } from './notes/types.ts';
export {
	createNotificationsService,
	type NotificationsService,
} from './notifications/service.ts';
export type { NotificationDelivery, NotificationDto } from './notifications/types.ts';
export { IdSchema } from './schemas/common/id.ts';
export type { CounterInput } from './schemas/counters/counter-input.ts';
export type { NoteInput } from './schemas/notes/note-input.ts';
export {
	createUsersService,
	toTelegramIdentity,
	toUserDto,
	type UsersService,
} from './users/service.ts';
export type { TelegramIdentity, UserDto } from './users/types.ts';
