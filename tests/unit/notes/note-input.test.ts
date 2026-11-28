import { describe, expect, test } from 'bun:test';
import {
	NOTE_CONTENT_MAX,
	NOTE_TITLE_MAX,
	NOTE_TITLE_REQUIRED_MESSAGE,
} from '#core/constants/notes.ts';
import { NoteInputSchema } from '#core/schemas/notes/note-input.ts';

describe('NoteInputSchema', () => {
	test('Тест обрезки пробелов по краям', () => {
		expect(NoteInputSchema.parse({ title: '  Покупки ', content: ' молоко  ' })).toEqual({
			title: 'Покупки',
			content: 'молоко',
		});
	});

	test('Тест подстановки пустой строки вместо недостающего текста', () => {
		expect(NoteInputSchema.parse({ title: 'Только заголовок' })).toEqual({
			title: 'Только заголовок',
			content: '',
		});
	});

	test('Тест отклонения заметки без заголовка, в том числе из одних пробелов', () => {
		for (const input of [{}, { content: 'Только текст' }, { title: '   ', content: 'Текст' }]) {
			const result = NoteInputSchema.safeParse(input);
			expect(result.error?.issues[0]?.message).toBe(NOTE_TITLE_REQUIRED_MESSAGE);
		}
	});

	test(`Тест ограничения заголовка ${NOTE_TITLE_MAX} символами включительно`, () => {
		expect(NoteInputSchema.safeParse({ title: 'а'.repeat(NOTE_TITLE_MAX) }).success).toBe(true);
		expect(NoteInputSchema.safeParse({ title: 'а'.repeat(NOTE_TITLE_MAX + 1) }).success).toBe(
			false,
		);
	});

	test(`Тест ограничения текста ${NOTE_CONTENT_MAX} символами включительно`, () => {
		expect(
			NoteInputSchema.safeParse({ title: 'Т', content: 'а'.repeat(NOTE_CONTENT_MAX) }).success,
		).toBe(true);
		expect(
			NoteInputSchema.safeParse({ title: 'Т', content: 'а'.repeat(NOTE_CONTENT_MAX + 1) }).success,
		).toBe(false);
	});

	test('Тест подсчёта лимита после обрезки пробелов', () => {
		const title = ` ${'а'.repeat(NOTE_TITLE_MAX)} `;
		expect(NoteInputSchema.safeParse({ title }).success).toBe(true);
	});

	test('Тест отклонения ввода не той формы', () => {
		expect(NoteInputSchema.safeParse({ title: 42 }).success).toBe(false);
		expect(NoteInputSchema.safeParse(null).success).toBe(false);
	});
});
