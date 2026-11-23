import { describe, expect, test } from 'bun:test';
import { displayUrl, linkify } from '#web/lib/utils/linkify.ts';

describe('linkify', () => {
	test('Возврат одного текстового фрагмента для текста без ссылок', () => {
		expect(linkify('Купить молоко')).toEqual([{ type: 'text', value: 'Купить молоко' }]);
	});

	test('Возврат пустого списка для пустого текста', () => {
		expect(linkify('')).toEqual([]);
	});

	test('Разбиение текста на фрагменты вокруг ссылки', () => {
		expect(linkify('Смотри https://example.com сегодня')).toEqual([
			{ type: 'text', value: 'Смотри ' },
			{ type: 'link', value: 'https://example.com', href: 'https://example.com' },
			{ type: 'text', value: ' сегодня' },
		]);
	});

	test('Подстановка https для ссылки, которая начинается с www.', () => {
		expect(linkify('www.example.com')).toEqual([
			{ type: 'link', value: 'www.example.com', href: 'https://www.example.com' },
		]);
	});

	test('Отбрасывание знаков препинания в конце ссылки', () => {
		expect(linkify('Тут: https://example.com/page).')).toEqual([
			{ type: 'text', value: 'Тут: ' },
			{ type: 'link', value: 'https://example.com/page', href: 'https://example.com/page' },
			{ type: 'text', value: ').' },
		]);
	});

	test('Нахождение нескольких ссылок подряд', () => {
		const links = linkify('http://a.com и https://b.com')
			.filter((segment) => segment.type === 'link')
			.map((segment) => segment.value);
		expect(links).toEqual(['http://a.com', 'https://b.com']);
	});
});

describe('displayUrl', () => {
	test('Отбрасывание протокола и завершающего слэша', () => {
		expect(displayUrl('https://example.com/')).toBe('example.com');
		expect(displayUrl('http://example.com/page/')).toBe('example.com/page');
	});

	test('Возврат адреса без протокола как есть', () => {
		expect(displayUrl('www.example.com')).toBe('www.example.com');
	});
});
