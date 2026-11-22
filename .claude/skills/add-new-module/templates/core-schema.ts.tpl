import { z } from 'zod';
import { __ENTITY___TITLE_MAX } from '../../constants/__entities__.ts';

/** Ввод __Title__ (создание и изменение). */
export const __Entity__InputSchema = z.object({
	title: z
		.string()
		.trim()
		.min(1, 'Название не может быть пустым')
		.max(__ENTITY___TITLE_MAX),
});

export type __Entity__Input = z.input<typeof __Entity__InputSchema>;

// Запрос списка (`q`, `limit`) — общий `ListQuerySchema` из `../common/list-query.ts` (тот же каталог `schemas/`).
// Своя схема — только если модулю нужны доп. параметры: `ListQuerySchema.extend({ … })` — в этой же папке.
