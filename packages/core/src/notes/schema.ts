import { z } from 'zod';

export const NOTE_TITLE_MAX = 200;
export const NOTE_CONTENT_MAX = 20_000;

export const noteInputSchema = z
  .object({
    title: z.string().trim().max(NOTE_TITLE_MAX).default(''),
    content: z.string().trim().max(NOTE_CONTENT_MAX).default(''),
  })
  .refine((n) => n.title.length > 0 || n.content.length > 0, {
    message: 'Заметка не может быть пустой',
  });

export type NoteInput = z.input<typeof noteInputSchema>;

export const noteListQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type NoteListQuery = z.input<typeof noteListQuerySchema>;

export interface NoteDto {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}
