import type { __Entity__, PrismaClient } from '@tgab/db';
import { assertId } from '../common/id.ts';
import { parseInput } from '../common/parse-input.ts';
import { __ENTITY___NOT_FOUND_MESSAGE } from '../constants/__entities__.ts';
import { NotFoundError } from '../errors.ts';
import { __Entity__InputSchema } from '../schemas/__entities__/__entity__-input.ts';
import { ListQuerySchema } from '../schemas/common/list-query.ts';
import type { __Entity__Dto } from './types.ts';

type __Entity__Row = Pick<__Entity__, 'id' | 'title' | 'createdAt' | 'updatedAt'>;

const select = { id: true, title: true, createdAt: true, updatedAt: true } as const;

function to__Entity__Dto(row: __Entity__Row): __Entity__Dto {
	return {
		id: row.id,
		title: row.title,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
	};
}

/**
 * Все методы принимают userId явно и работают только с записями этого пользователя.
 * Ввод снаружи (`query`, `input`) — `unknown`: его разбирает `parseInput` здесь (ошибка ввода —
 * `ValidationError` → 400), без `as` у вызывающего.
 */
export function create__Entities__Service(db: PrismaClient) {
	return {
		async list(userId: string, query: unknown = {}): Promise<__Entity__Dto[]> {
			const { q: searchQuery, limit } = parseInput(ListQuerySchema, query);
			// Поиск по подстроке. Полнотекстовый — см. notes/service.ts ($queryRaw + tsvector).
			// Порядок — от новых к старым (updatedAt desc): кеш списка в RestResource на клиенте
			// кладёт созданную или изменённую запись в начало. Другой порядок — поправь и кеш.
			const rows = await db.__entity__.findMany({
				where: {
					userId,
					...(searchQuery ? { title: { contains: searchQuery, mode: 'insensitive' } } : {}),
				},
				orderBy: { updatedAt: 'desc' },
				take: limit,
				select,
			});
			return rows.map(to__Entity__Dto);
		},

		async get(userId: string, id: string): Promise<__Entity__Dto> {
			assertId(id, __ENTITY___NOT_FOUND_MESSAGE);
			const row = await db.__entity__.findFirst({ where: { id, userId }, select });
			if (!row) throw new NotFoundError(__ENTITY___NOT_FOUND_MESSAGE);
			return to__Entity__Dto(row);
		},

		async create(userId: string, input: unknown): Promise<__Entity__Dto> {
			const data = parseInput(__Entity__InputSchema, input);
			const row = await db.__entity__.create({ data: { ...data, userId }, select });
			return to__Entity__Dto(row);
		},

		async update(userId: string, id: string, input: unknown): Promise<__Entity__Dto> {
			assertId(id, __ENTITY___NOT_FOUND_MESSAGE);
			const data = parseInput(__Entity__InputSchema, input);
			const { count } = await db.__entity__.updateMany({ where: { id, userId }, data });
			if (count === 0) throw new NotFoundError(__ENTITY___NOT_FOUND_MESSAGE);
			return this.get(userId, id);
		},

		async remove(userId: string, id: string): Promise<void> {
			assertId(id, __ENTITY___NOT_FOUND_MESSAGE);
			const { count } = await db.__entity__.deleteMany({ where: { id, userId } });
			if (count === 0) throw new NotFoundError(__ENTITY___NOT_FOUND_MESSAGE);
		},
	};
}

export type __Entities__Service = ReturnType<typeof create__Entities__Service>;
