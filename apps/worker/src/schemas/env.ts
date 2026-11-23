import {
	BotTokenSchema,
	DatabaseUrlSchema,
	MiniAppUrlSchema,
	optionalEnv,
	RedisUrlSchema,
} from '@tgab/core/env';
import { z } from 'zod';
import { DEFAULT_REDIS_URL } from '#worker/constants/redis.ts';

/** Переменные окружения воркера. Разбор и сообщение об ошибке — в `env.ts`. */
export const EnvSchema = z.object({
	/** Токен бота: воркер отправляет сообщения от его имени (обновления не получает). */
	BOT_TOKEN: BotTokenSchema,
	DATABASE_URL: DatabaseUrlSchema,
	REDIS_URL: optionalEnv(RedisUrlSchema).transform((url) => url ?? DEFAULT_REDIS_URL),
	/** Если задан, в сообщении об окончании цикла — кнопка, открывающая уведомление в Mini App. */
	MINI_APP_URL: optionalEnv(MiniAppUrlSchema),
});
