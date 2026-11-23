import { z } from 'zod';
import {
	__ENTITY___TITLE_MAX,
	__ENTITY___TITLE_REQUIRED_MESSAGE,
} from '../../constants/__entities__.ts';

/** Ввод __Title__ (создание и изменение). Поле title — пример, замени на реальные поля. */
export const __Entity__InputSchema = z.object({
	// `{ error }` — сообщение и для отсутствующего поля, а не только для пустой строки.
	title: z
		.string({ error: __ENTITY___TITLE_REQUIRED_MESSAGE })
		.trim()
		.min(1, __ENTITY___TITLE_REQUIRED_MESSAGE)
		.max(__ENTITY___TITLE_MAX),
});

export type __Entity__Input = z.input<typeof __Entity__InputSchema>;

// Запрос списка (`q`, `limit`) — общий `ListQuerySchema` из `../common/list-query.ts`.
// Своя схема — только если модулю нужны доп. параметры:
// `ListQuerySchema.extend({ … })` — в этой же папке.
