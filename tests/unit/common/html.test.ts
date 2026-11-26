import { describe, expect, test } from 'bun:test';
import { escapeHtml } from '#core/common/html.ts';

describe('escapeHtml', () => {
	test('Экранирование символов разметки Telegram HTML', () => {
		expect(escapeHtml('<b>Вода & сок</b>')).toBe('&lt;b&gt;Вода &amp; сок&lt;/b&gt;');
	});

	test('Амперсанд уже экранированной сущности экранируется заново', () => {
		expect(escapeHtml('&lt;')).toBe('&amp;lt;');
	});

	test('Текст без спецсимволов не меняется', () => {
		expect(escapeHtml('Счётчик "Вода" — 5')).toBe('Счётчик "Вода" — 5');
	});
});
