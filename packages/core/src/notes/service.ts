import { Prisma, type Note, type PrismaClient } from '@tgab/db';
import { NotFoundError } from '../errors.ts';
import {
  noteInputSchema,
  noteListQuerySchema,
  type NoteDto,
  type NoteInput,
  type NoteListQuery,
} from './schema.ts';
import { buildPrefixTsQuery } from './search.ts';

type NoteRow = Pick<Note, 'id' | 'title' | 'content' | 'createdAt' | 'updatedAt'>;

const select = { id: true, title: true, content: true, createdAt: true, updatedAt: true } as const;

export function toNoteDto(n: NoteRow): NoteDto {
  return {
    id: n.id,
    title: n.title,
    content: n.content,
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
  };
}

function escapeLike(s: string): string {
  return s.replace(/[\\%_]/g, (c) => `\\${c}`);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Все методы принимают userId явно и работают только с заметками этого пользователя. */
export function createNotesService(db: PrismaClient) {
  return {
    async list(userId: string, query: NoteListQuery = {}): Promise<NoteDto[]> {
      const { q, limit } = noteListQuerySchema.parse(query);
      if (!q) {
        const rows = await db.note.findMany({
          where: { userId },
          orderBy: { updatedAt: 'desc' },
          take: limit,
          select,
        });
        return rows.map(toNoteDto);
      }

      // Полнотекстовый поиск (морфология, префиксы слов) + подстрока —
      // чтобы находились ссылки и фрагменты, которые парсер tsvector режет иначе.
      const tsQuery = buildPrefixTsQuery(q);
      const like = `%${escapeLike(q)}%`;
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
          AND (${ftsMatch} OR title ILIKE ${like} OR content ILIKE ${like})
        ORDER BY ${rank} DESC, "updatedAt" DESC
        LIMIT ${limit}
      `;
      return rows.map(toNoteDto);
    },

    async get(userId: string, id: string): Promise<NoteDto> {
      if (!UUID_RE.test(id)) throw new NotFoundError('Заметка не найдена');
      const note = await db.note.findFirst({ where: { id, userId }, select });
      if (!note) throw new NotFoundError('Заметка не найдена');
      return toNoteDto(note);
    },

    async create(userId: string, input: NoteInput): Promise<NoteDto> {
      const data = noteInputSchema.parse(input);
      const note = await db.note.create({ data: { ...data, userId }, select });
      return toNoteDto(note);
    },

    async update(userId: string, id: string, input: NoteInput): Promise<NoteDto> {
      if (!UUID_RE.test(id)) throw new NotFoundError('Заметка не найдена');
      const data = noteInputSchema.parse(input);
      const { count } = await db.note.updateMany({ where: { id, userId }, data });
      if (count === 0) throw new NotFoundError('Заметка не найдена');
      return this.get(userId, id);
    },

    async remove(userId: string, id: string): Promise<void> {
      if (!UUID_RE.test(id)) throw new NotFoundError('Заметка не найдена');
      const { count } = await db.note.deleteMany({ where: { id, userId } });
      if (count === 0) throw new NotFoundError('Заметка не найдена');
    },
  };
}

export type NotesService = ReturnType<typeof createNotesService>;
