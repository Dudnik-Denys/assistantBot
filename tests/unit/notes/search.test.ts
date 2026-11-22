import { describe, expect, test } from 'bun:test';
import { SEARCH_WORDS_MAX } from '#core/constants/notes.ts';
import { buildPrefixTsQuery } from '#core/notes/search.ts';

describe('buildPrefixTsQuery', () => {
	test('Разбиение запроса на слова в нижнем регистре с префиксным поиском', () => {
		expect(buildPrefixTsQuery('Погода  Киев')).toBe('погода:* & киев:*');
	});

	test('Отбрасывание спецсимволов tsquery', () => {
		expect(buildPrefixTsQuery("a' | b & !c")).toBe('a:* & b:* & c:*');
	});

	test('Разбиение ссылки на слова', () => {
		expect(buildPrefixTsQuery('github.com/foo')).toBe('github:* & com:* & foo:*');
	});

	test('Сохранение цифр', () => {
		expect(buildPrefixTsQuery('план 2026')).toBe('план:* & 2026:*');
	});

	test(`Ограничение запроса ${SEARCH_WORDS_MAX} первыми словами`, () => {
		const words = Array.from({ length: SEARCH_WORDS_MAX + 1 }, (_, index) => `слово${index}`);
		const query = buildPrefixTsQuery(words.join(' '));
		expect(query?.split(' & ')).toEqual(
			words.slice(0, SEARCH_WORDS_MAX).map((word) => `${word}:*`),
		);
	});

	test('Возврат null для запроса без букв и цифр', () => {
		expect(buildPrefixTsQuery('  !!! ')).toBeNull();
		expect(buildPrefixTsQuery('')).toBeNull();
	});
});
