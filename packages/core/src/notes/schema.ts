import { z } from 'zod';
import { NOTE_CONTENT_MAX, NOTE_TITLE_MAX } from './limits.ts';

export const NoteInputSchema = z
	.object({
		title: z.string().trim().max(NOTE_TITLE_MAX).default(''),
		content: z.string().trim().max(NOTE_CONTENT_MAX).default(''),
	})
	.refine((note) => note.title.length > 0 || note.content.length > 0, {
		message: 'Заметка не может быть пустой',
	});

export type NoteInput = z.input<typeof NoteInputSchema>;

/** Заметка в ответе API: даты — ISO-строки. */
export interface NoteDto {
	id: string;
	title: string;
	content: string;
	createdAt: string;
	updatedAt: string;
}
