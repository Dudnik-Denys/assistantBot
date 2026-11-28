import { describe, expect, test } from 'bun:test';
import { escapeHtml } from '#core/common/html.ts';

describe('escapeHtml', () => {
	test('Тест экранирования символов разметки Telegram HTML', () => {
		expect(escapeHtml('<b>Вода & сок</b>')).toBe('&lt;b&gt;Вода &amp; сок&lt;/b&gt;');
	});

	test('Тест повторного экранирования амперсанда уже экранированной сущности', () => {
		expect(escapeHtml('&lt;')).toBe('&amp;lt;');
	});

	test('Тест неизменности текста без спецсимволов', () => {
		expect(escapeHtml('Счётчик "Вода" — 5')).toBe('Счётчик "Вода" — 5');
	});
});
