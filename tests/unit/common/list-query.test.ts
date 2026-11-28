import { describe, expect, test } from 'bun:test';
import { LIST_LIMIT_DEFAULT, LIST_LIMIT_MAX, SEARCH_QUERY_MAX } from '#core/constants/list.ts';
import { ListQuerySchema } from '#core/schemas/common/list-query.ts';

describe('ListQuerySchema', () => {
	test(`Тест подстановки limit ${LIST_LIMIT_DEFAULT} и отсутствия поиска без параметров`, () => {
		expect(ListQuerySchema.parse({})).toEqual({ limit: LIST_LIMIT_DEFAULT });
	});

	test('Тест превращения limit из query-строки в число', () => {
		expect(ListQuerySchema.parse({ limit: '20' }).limit).toBe(20);
	});

	test(`Тест ограничения limit диапазоном от 1 до ${LIST_LIMIT_MAX} включительно`, () => {
		expect(ListQuerySchema.safeParse({ limit: '1' }).success).toBe(true);
		expect(ListQuerySchema.safeParse({ limit: String(LIST_LIMIT_MAX) }).success).toBe(true);
		expect(ListQuerySchema.safeParse({ limit: '0' }).success).toBe(false);
		expect(ListQuerySchema.safeParse({ limit: String(LIST_LIMIT_MAX + 1) }).success).toBe(false);
	});

	test('Тест отклонения нецелого limit', () => {
		expect(ListQuerySchema.safeParse({ limit: '1.5' }).success).toBe(false);
		expect(ListQuerySchema.safeParse({ limit: 'много' }).success).toBe(false);
	});

	test('Тест обрезки пробелов в поисковой строке', () => {
		expect(ListQuerySchema.parse({ q: '  погода ' }).q).toBe('погода');
	});

	test(`Тест ограничения поисковой строки ${SEARCH_QUERY_MAX} символами включительно`, () => {
		expect(ListQuerySchema.safeParse({ q: 'а'.repeat(SEARCH_QUERY_MAX) }).success).toBe(true);
		expect(ListQuerySchema.safeParse({ q: 'а'.repeat(SEARCH_QUERY_MAX + 1) }).success).toBe(false);
	});
});
