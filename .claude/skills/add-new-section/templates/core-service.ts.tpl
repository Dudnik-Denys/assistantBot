import type { __Entity__, PrismaClient } from '@tgab/db';
import { NotFoundError } from '../errors.ts';
import {
	type __Entity__Dto,
	type __Entity__Input,
	type __Entity__ListQuery,
	__entity__InputSchema,
	__entity__ListQuerySchema,
} from './schema.ts';

type __Entity__Row = Pick<__Entity__, 'id' | 'title' | 'createdAt' | 'updatedAt'>;

const select = { id: true, title: true, createdAt: true, updatedAt: true } as const;

export function to__Entity__Dto(row: __Entity__Row): __Entity__Dto {
	return {
		id: row.id,
		title: row.title,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
	};
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NOT_FOUND = '__Title__: запись не найдена'; // замени на «Счётчик не найден» и т. п.

/** Все методы принимают userId явно и работают только с записями этого пользователя. */
export function create__Entities__Service(db: PrismaClient) {
	return {
		async list(userId: string, query: __Entity__ListQuery = {}): Promise<__Entity__Dto[]> {
			const { q, limit } = __entity__ListQuerySchema.parse(query);
			// Поиск по подстроке. Если нужен полнотекстовый — см. notes/service.ts ($queryRaw + tsvector).
			const rows = await db.__entity__.findMany({
				where: { userId, ...(q ? { title: { contains: q, mode: 'insensitive' } } : {}) },
				orderBy: { updatedAt: 'desc' },
				take: limit,
				select,
			});
			return rows.map(to__Entity__Dto);
		},

		async get(userId: string, id: string): Promise<__Entity__Dto> {
			if (!UUID_RE.test(id)) throw new NotFoundError(NOT_FOUND);
			const row = await db.__entity__.findFirst({ where: { id, userId }, select });
			if (!row) throw new NotFoundError(NOT_FOUND);
			return to__Entity__Dto(row);
		},

		async create(userId: string, input: __Entity__Input): Promise<__Entity__Dto> {
			const data = __entity__InputSchema.parse(input);
			const row = await db.__entity__.create({ data: { ...data, userId }, select });
			return to__Entity__Dto(row);
		},

		async update(userId: string, id: string, input: __Entity__Input): Promise<__Entity__Dto> {
			if (!UUID_RE.test(id)) throw new NotFoundError(NOT_FOUND);
			const data = __entity__InputSchema.parse(input);
			const { count } = await db.__entity__.updateMany({ where: { id, userId }, data });
			if (count === 0) throw new NotFoundError(NOT_FOUND);
			return this.get(userId, id);
		},

		async remove(userId: string, id: string): Promise<void> {
			if (!UUID_RE.test(id)) throw new NotFoundError(NOT_FOUND);
			const { count } = await db.__entity__.deleteMany({ where: { id, userId } });
			if (count === 0) throw new NotFoundError(NOT_FOUND);
		},
	};
}

export type __Entities__Service = ReturnType<typeof create__Entities__Service>;
