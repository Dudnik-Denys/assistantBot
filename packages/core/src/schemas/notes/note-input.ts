import { z } from 'zod';
import { NOTE_CONTENT_MAX, NOTE_TITLE_MAX } from '../../constants/notes.ts';

const TITLE_REQUIRED = 'Укажите заголовок';

/** Ввод заметки (создание и изменение): заголовок обязателен (по нему идёт поиск), текст — нет. */
export const NoteInputSchema = z.object({
	title: z.string({ error: TITLE_REQUIRED }).trim().min(1, TITLE_REQUIRED).max(NOTE_TITLE_MAX),
	content: z.string().trim().max(NOTE_CONTENT_MAX).default(''),
});

export type NoteInput = z.input<typeof NoteInputSchema>;
