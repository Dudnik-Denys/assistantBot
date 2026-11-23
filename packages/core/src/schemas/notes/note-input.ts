import { z } from 'zod';
import {
	NOTE_CONTENT_MAX,
	NOTE_TITLE_MAX,
	NOTE_TITLE_REQUIRED_MESSAGE,
} from '../../constants/notes.ts';

/** Ввод заметки (создание и изменение): заголовок обязателен (по нему идёт поиск), текст — нет. */
export const NoteInputSchema = z.object({
	title: z
		.string({ error: NOTE_TITLE_REQUIRED_MESSAGE })
		.trim()
		.min(1, NOTE_TITLE_REQUIRED_MESSAGE)
		.max(NOTE_TITLE_MAX),
	content: z.string().trim().max(NOTE_CONTENT_MAX).default(''),
});

export type NoteInput = z.input<typeof NoteInputSchema>;
