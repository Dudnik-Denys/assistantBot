// Вход `@tgab/core/dto`: схемы ответов API для клиента (Mini App проверяет ими ответы сервера).
// Только схемы и константы — без сервисов и Prisma, поэтому годится для браузера.

export { CounterDtoSchema } from './counters/counter-dto.ts';
export { NoteDtoSchema } from './notes/note-dto.ts';
export { NotificationDtoSchema } from './notifications/notification-dto.ts';
export { UserDtoSchema } from './users/user-dto.ts';
