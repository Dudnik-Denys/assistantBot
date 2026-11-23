import type { __Entity__, PrismaClient } from '@tgab/db';
import { assertId } from '../common/id.ts';
import { NotFoundError } from '../errors.ts';
import { __Entity__InputSchema } from '../schemas/__entities__/__entity__-input.ts';
import { ListQuerySchema } from '../schemas/common/list-query.ts';
import type { __Entity__Dto } from './types.ts';

type __Entity__Row = Pick<__Entity__, 'id' | 'title' | 'createdAt' | 'updatedAt'>;

const select = { id: true, title: true, createdAt: true, updatedAt: true } as const;

const NOT_FOUND = '__Title__: запись не найдена'; // замени на «Счётчик не найден» и т. п.

export function to__Entity__Dto(row: __Entity__Row): __Entity__Dto {
	return {
		id: row.id,
		title: row.title,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
	};
}

/**
 * Все методы принимают userId явно и работают только с записями этого пользователя.
 * Ввод снаружи (`query`, `input`) — `unknown`: его проверяет схема здесь, без `as` у вызывающего.
 */
export function create__Entities__Service(db: PrismaClient) {
	return {
		async list(userId: string, query: unknown = {}): Promise<__Entity__Dto[]> {
			const { q, limit } = ListQuerySchema.parse(query);
			// Поиск по подстроке. Если нужен полнотекстовый — см. notes/service.ts ($queryRaw + tsvector).
			// Порядок — от новых к старым (updatedAt desc): кеш списка в RestResource на клиенте
			// кладёт созданную или изменённую запись в начало. Другой порядок — поправь и кеш.
			const rows = await db.__entity__.findMany({
				where: { userId, ...(q ? { title: { contains: q, mode: 'insensitive' } } : {}) },
				orderBy: { updatedAt: 'desc' },
				take: limit,
				select,
			});
			return rows.map(to__Entity__Dto);
		},

		async get(userId: string, id: string): Promise<__Entity__Dto> {
			assertId(id, NOT_FOUND);
			const row = await db.__entity__.findFirst({ where: { id, userId }, select });
			if (!row) throw new NotFoundError(NOT_FOUND);
			return to__Entity__Dto(row);
		},

		async create(userId: string, input: unknown): Promise<__Entity__Dto> {
			const data = __Entity__InputSchema.parse(input);
			const row = await db.__entity__.create({ data: { ...data, userId }, select });
			return to__Entity__Dto(row);
		},

		async update(userId: string, id: string, input: unknown): Promise<__Entity__Dto> {
			assertId(id, NOT_FOUND);
			const data = __Entity__InputSchema.parse(input);
			const { count } = await db.__entity__.updateMany({ where: { id, userId }, data });
			if (count === 0) throw new NotFoundError(NOT_FOUND);
			return this.get(userId, id);
		},

		async remove(userId: string, id: string): Promise<void> {
			assertId(id, NOT_FOUND);
			const { count } = await db.__entity__.deleteMany({ where: { id, userId } });
			if (count === 0) throw new NotFoundError(NOT_FOUND);
		},
	};
}

export type __Entities__Service = ReturnType<typeof create__Entities__Service>;
