import { describe, expect, test } from 'bun:test';
import { mergeClasses } from '#web/lib/utils/classes.ts';

describe('mergeClasses', () => {
	test('Тест склейки строк, массивов и условий', () => {
		expect(mergeClasses('px-4', ['flex', 'gap-2'], { hidden: false, rounded: true })).toBe(
			'px-4 flex gap-2 rounded',
		);
	});

	test('Тест победы класса, переданного позже, при конфликте стандартных классов', () => {
		expect(mergeClasses('px-4 pb-3', 'px-2')).toBe('pb-3 px-2');
	});

	test('Тест конфликта стандартного отступа с токеном проекта', () => {
		expect(mergeClasses('pb-3', 'pb-page-b')).toBe('pb-page-b');
		expect(mergeClasses('pt-safe-top', 'pt-2')).toBe('pt-2');
	});

	test('Тест пропуска пустых значений', () => {
		expect(mergeClasses('px-4', undefined, null, false, '')).toBe('px-4');
	});
});
