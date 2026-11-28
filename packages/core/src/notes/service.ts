import { type Note, Prisma, type PrismaClient } from '@tgab/db';
import { assertId } from '../common/id.ts';
import { parseInput } from '../common/parse-input.ts';
import { NOTE_NOT_FOUND_MESSAGE } from '../constants/notes.ts';
import { NotFoundError } from '../errors.ts';
import { ListQuerySchema } from '../schemas/common/list-query.ts';
import { NoteInputSchema } from '../schemas/notes/note-input.ts';
import { buildPrefixTsQuery } from './search.ts';
import type { NoteDto } from './types.ts';

type NoteRow = Pick<Note, 'id' | 'title' | 'content' | 'createdAt' | 'updatedAt'>;

const select = { id: true, title: true, content: true, createdAt: true, updatedAt: true } as const;

function toNoteDto(row: NoteRow): NoteDto {
	return {
		id: row.id,
		title: row.title,
		content: row.content,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
	};
}

/** Экранирует спецсимволы LIKE (`\`, `%`, `_`), чтобы они искались как обычные символы. */
function escapeLike(text: string): string {
	return text.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/**
 * Все методы принимают userId явно и работают только с заметками этого пользователя.
 * Ввод снаружи (`query`, `input`) — `unknown`: его проверяет схема здесь, вызывающему коду
 * не нужно приводить тип (`as NoteInput`). Тип ввода для клиента — `NoteInput`.
 */
export function createNotesService(db: PrismaClient) {
	return {
		async list(userId: string, query: unknown = {}): Promise<NoteDto[]> {
			const { q: searchQuery, limit } = parseInput(ListQuerySchema, query);
			if (!searchQuery) {
				const rows = await db.note.findMany({
					where: { userId },
					orderBy: { updatedAt: 'desc' },
					take: limit,
					select,
				});
				return rows.map(toNoteDto);
			}

			// Поиск только по заголовку: полнотекстовый (морфология, префиксы слов) + подстрока —
			// чтобы находились фрагменты, которые парсер tsvector режет иначе («50%», адреса).
			const tsQuery = buildPrefixTsQuery(searchQuery);
			const like = `%${escapeLike(searchQuery)}%`;
			const ftsMatch = tsQuery
				? Prisma.sql`search @@ to_tsquery('russian', ${tsQuery})`
				: Prisma.sql`FALSE`;
			const rank = tsQuery
				? Prisma.sql`ts_rank(search, to_tsquery('russian', ${tsQuery}))`
				: Prisma.sql`0::real`; // литерал 0 в ORDER BY — это номер колонки

			const rows = await db.$queryRaw<NoteRow[]>`
				SELECT id, title, content, "createdAt", "updatedAt"
				FROM "Note"
				WHERE "userId" = ${userId}::uuid
				AND (${ftsMatch} OR title ILIKE ${like})
				ORDER BY ${rank} DESC, "updatedAt" DESC
				LIMIT ${limit}
			`;
			return rows.map(toNoteDto);
		},

		async get(userId: string, id: string): Promise<NoteDto> {
			assertId(id, NOTE_NOT_FOUND_MESSAGE);
			const note = await db.note.findFirst({ where: { id, userId }, select });
			if (!note) throw new NotFoundError(NOTE_NOT_FOUND_MESSAGE);
			return toNoteDto(note);
		},

		async create(userId: string, input: unknown): Promise<NoteDto> {
			const data = parseInput(NoteInputSchema, input);
			const note = await db.note.create({ data: { ...data, userId }, select });
			return toNoteDto(note);
		},

		async update(userId: string, id: string, input: unknown): Promise<NoteDto> {
			assertId(id, NOTE_NOT_FOUND_MESSAGE);
			const data = parseInput(NoteInputSchema, input);
			const { count } = await db.note.updateMany({ where: { id, userId }, data });
			if (count === 0) throw new NotFoundError(NOTE_NOT_FOUND_MESSAGE);
			return this.get(userId, id);
		},

		async remove(userId: string, id: string): Promise<void> {
			assertId(id, NOTE_NOT_FOUND_MESSAGE);
			const { count } = await db.note.deleteMany({ where: { id, userId } });
			if (count === 0) throw new NotFoundError(NOTE_NOT_FOUND_MESSAGE);
		},
	};
}

export type NotesService = ReturnType<typeof createNotesService>;
