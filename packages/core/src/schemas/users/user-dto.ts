import { z } from 'zod';
import { IdSchema } from '../common/id.ts';

/**
 * Текущий (вошедший) пользователь в ответе API (`GET /api/user`).
 * telegramId — строка: bigint не сериализуется в JSON.
 */
export const UserDtoSchema = z.object({
	id: IdSchema,
	telegramId: z.string(),
	firstName: z.string().nullable(),
	isAdmin: z.boolean(),
	timezone: z.string(),
});

export type UserDto = z.infer<typeof UserDtoSchema>;
