import { afterAll, beforeEach, describe, expect, test } from 'bun:test';
import { createNotesService, NotFoundError, ValidationError } from '@tgab/core';
import type { User } from '@tgab/db';
import { createTestNote, createTestUser } from '../../helpers/factories.ts';
import { TestDatabase } from '../../helpers/test-database.ts';

const testDatabase = TestDatabase.fromEnv();
const db = testDatabase.createClient();
const notes = createNotesService(db);
let owner: User;
let stranger: User;

beforeEach(async () => {
	await testDatabase.reset(db);
	owner = await createTestUser(db);
	stranger = await createTestUser(db);
});

afterAll(() => db.$disconnect());

describe('create', () => {
	test('Возврат DTO с обрезанными пробелами и датами-строками', async () => {
		const note = await notes.create(owner.id, { title: '  Покупки  ', content: ' молоко ' });
		expect(note).toMatchObject({ title: 'Покупки', content: 'молоко' });
		expect(typeof note.createdAt).toBe('string');
		expect(Object.keys(note).sort()).toEqual(['content', 'createdAt', 'id', 'title', 'updatedAt']);
	});

	test('Отклонение заметки без заголовка', async () => {
		await expect(notes.create(owner.id, { title: ' ', content: 'Текст' })).rejects.toThrow(
			ValidationError,
		);
	});

	test('Отклонение ввода не той формы', async () => {
		await expect(notes.create(owner.id, { title: 42 })).rejects.toThrow(ValidationError);
	});
});

describe('get', () => {
	test('Возврат своей заметки', async () => {
		const created = await createTestNote(db, owner.id);
		expect(await notes.get(owner.id, created.id)).toEqual(created);
	});

	test('Выброс NotFoundError для чужой заметки вместо доступа к ней', async () => {
		const created = await createTestNote(db, owner.id);
		await expect(notes.get(stranger.id, created.id)).rejects.toThrow(NotFoundError);
	});

	test('Выброс NotFoundError для id не в формате UUID', async () => {
		await expect(notes.get(owner.id, 'not-a-uuid')).rejects.toThrow(NotFoundError);
	});
});

describe('list', () => {
	test('Выдача только заметок владельца, новые сверху', async () => {
		const first = await createTestNote(db, owner.id, { title: 'Первая' });
		await Bun.sleep(5); // updatedAt с точностью до миллисекунд: без паузы порядок может совпасть
		const second = await createTestNote(db, owner.id, { title: 'Вторая' });
		await createTestNote(db, stranger.id, { title: 'Чужая' });

		const list = await notes.list(owner.id);
		expect(list.map((note) => note.id)).toEqual([second.id, first.id]);
	});

	test('Учёт limit', async () => {
		await createTestNote(db, owner.id, { title: 'Первая' });
		await createTestNote(db, owner.id, { title: 'Вторая' });
		expect(await notes.list(owner.id, { limit: '1' })).toHaveLength(1);
	});

	test('Поиск по началу слова с учётом морфологии', async () => {
		await createTestNote(db, owner.id, { title: 'Погода в Киеве' });
		await createTestNote(db, owner.id, { title: 'Список покупок' });
		const found = await notes.list(owner.id, { q: 'погод' });
		expect(found.map((note) => note.title)).toEqual(['Погода в Киеве']);
	});

	test('Поиск по подстроке заголовка', async () => {
		await createTestNote(db, owner.id, { title: 'github.com/foo/bar' });
		expect(await notes.list(owner.id, { q: 'github.com/foo' })).toHaveLength(1);
	});

	test('Поиск только по заголовку, без текста', async () => {
		await createTestNote(db, owner.id, { title: 'Ссылки', content: 'Погода https://github.com' });
		expect(await notes.list(owner.id, { q: 'погода' })).toEqual([]);
		expect(await notes.list(owner.id, { q: 'github' })).toEqual([]);
	});

	test('Поиск % и _ как обычных символов', async () => {
		await createTestNote(db, owner.id, { title: 'Скидка 50%' });
		await createTestNote(db, owner.id, { title: 'Без процентов' });
		const found = await notes.list(owner.id, { q: '%' });
		expect(found.map((note) => note.title)).toEqual(['Скидка 50%']);
	});

	test('Защита от выполнения SQL из поискового запроса', async () => {
		await createTestNote(db, owner.id);
		const found = await notes.list(owner.id, { q: `'; DROP TABLE "Note"; --` });
		expect(found).toEqual([]);
		expect(await notes.list(owner.id)).toHaveLength(1);
	});

	test('Исключение чужих заметок из поиска', async () => {
		await createTestNote(db, stranger.id, { title: 'Погода' });
		expect(await notes.list(owner.id, { q: 'погода' })).toEqual([]);
	});
});

describe('update', () => {
	test('Изменение своей заметки', async () => {
		const created = await createTestNote(db, owner.id, { title: 'Было' });
		const updated = await notes.update(owner.id, created.id, { title: 'Стало' });
		expect(updated.title).toBe('Стало');
	});

	test('Запрет изменения чужой заметки', async () => {
		const created = await createTestNote(db, owner.id, { title: 'Было' });
		await expect(notes.update(stranger.id, created.id, { title: 'Взлом' })).rejects.toThrow(
			NotFoundError,
		);
		expect((await notes.get(owner.id, created.id)).title).toBe('Было');
	});
});

describe('remove', () => {
	test('Удаление своей заметки', async () => {
		const created = await createTestNote(db, owner.id);
		await notes.remove(owner.id, created.id);
		await expect(notes.get(owner.id, created.id)).rejects.toThrow(NotFoundError);
	});

	test('Запрет удаления чужой заметки', async () => {
		const created = await createTestNote(db, owner.id);
		await expect(notes.remove(stranger.id, created.id)).rejects.toThrow(NotFoundError);
		expect(await notes.get(owner.id, created.id)).toEqual(created);
	});
});
