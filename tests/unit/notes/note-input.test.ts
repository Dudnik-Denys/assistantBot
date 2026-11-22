import { describe, expect, test } from 'bun:test';
import { NOTE_CONTENT_MAX, NOTE_TITLE_MAX } from '#core/constants/notes.ts';
import { NoteInputSchema } from '#core/schemas/notes/note-input.ts';

describe('NoteInputSchema', () => {
	test('Обрезка пробелов по краям', () => {
		expect(NoteInputSchema.parse({ title: '  Покупки ', content: ' молоко  ' })).toEqual({
			title: 'Покупки',
			content: 'молоко',
		});
	});

	test('Подстановка пустой строки вместо недостающего поля', () => {
		expect(NoteInputSchema.parse({ title: 'Только заголовок' })).toEqual({
			title: 'Только заголовок',
			content: '',
		});
		expect(NoteInputSchema.parse({ content: 'Только текст' })).toEqual({
			title: '',
			content: 'Только текст',
		});
	});

	test('Отклонение пустой заметки, в том числе из одних пробелов', () => {
		for (const input of [{}, { title: '', content: '' }, { title: '   ', content: '\n' }]) {
			const result = NoteInputSchema.safeParse(input);
			expect(result.error?.issues[0]?.message).toBe('Заметка не может быть пустой');
		}
	});

	test(`Ограничение заголовка ${NOTE_TITLE_MAX} символами включительно`, () => {
		expect(NoteInputSchema.safeParse({ title: 'а'.repeat(NOTE_TITLE_MAX) }).success).toBe(true);
		expect(NoteInputSchema.safeParse({ title: 'а'.repeat(NOTE_TITLE_MAX + 1) }).success).toBe(
			false,
		);
	});

	test(`Ограничение текста ${NOTE_CONTENT_MAX} символами включительно`, () => {
		expect(NoteInputSchema.safeParse({ content: 'а'.repeat(NOTE_CONTENT_MAX) }).success).toBe(true);
		expect(NoteInputSchema.safeParse({ content: 'а'.repeat(NOTE_CONTENT_MAX + 1) }).success).toBe(
			false,
		);
	});

	test('Подсчёт лимита после обрезки пробелов', () => {
		const title = ` ${'а'.repeat(NOTE_TITLE_MAX)} `;
		expect(NoteInputSchema.safeParse({ title }).success).toBe(true);
	});

	test('Отклонение ввода не той формы', () => {
		expect(NoteInputSchema.safeParse({ title: 42 }).success).toBe(false);
		expect(NoteInputSchema.safeParse(null).success).toBe(false);
	});
});
