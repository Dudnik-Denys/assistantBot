// Вход `@tgab/core/env`: всё для переменных окружения и аргументов командной строки.
// Зависит только от zod — его импортируют `src/env.ts` SvelteKit, бот и тесты,
// не подтягивая сервисы и БД.
export { DatabaseUrlSchema, optionalEnv, TelegramIdSchema } from '../schemas/env/variables.ts';
export { parseEnv } from './parse.ts';
