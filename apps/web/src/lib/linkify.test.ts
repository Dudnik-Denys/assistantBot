import { expect, test } from 'bun:test';
import { linkify } from './linkify.ts';

test('linkify', () => {
	expect(linkify('см. https://example.com/a?b=1, и www.ya.ru.')).toEqual([
		{ type: 'text', value: 'см. ' },
		{ type: 'link', value: 'https://example.com/a?b=1', href: 'https://example.com/a?b=1' },
		{ type: 'text', value: ', и ' },
		{ type: 'link', value: 'www.ya.ru', href: 'https://www.ya.ru' },
		{ type: 'text', value: '.' }
	]);
	expect(linkify('без ссылок')).toEqual([{ type: 'text', value: 'без ссылок' }]);
});
