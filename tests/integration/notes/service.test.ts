import { afterAll, beforeEach, describe, expect, test } from 'bun:test';
import { createNotesService, NotFoundError } from '@tgab/core';
import type { User } from '@tgab/db';
import { z } from 'zod';
import { createTestNote, createTestUser } from '../../helpers/factories.ts';
import { createTestDb, resetDb } from '../../helpers/test-database.ts';

const db = createTestDb();
const notes = createNotesService(db);
let owner: User;
let stranger: User;

beforeEach(async () => {
	await resetDb(db);
	owner = await createTestUser(db);
	stranger = await createTestUser(db);
});

afterAll(() => db.$disconnect());

describe('create', () => {
	test('возвращает DTO с обрезанными пробелами и датами-строками', async () => {
		const note = await notes.create(owner.id, { title: '  Покупки  ', content: ' молоко ' });
		expect(note).toMatchObject({ title: 'Покупки', content: 'молоко' });
		expect(typeof note.createdAt).toBe('string');
		expect(Object.keys(note).sort()).toEqual(['content', 'createdAt', 'id', 'title', 'updatedAt']);
	});

	test('отклоняет пустую заметку', async () => {
		await expect(notes.create(owner.id, { title: ' ', content: '' })).rejects.toThrow(z.ZodError);
	});

	test('отклоняет ввод не той формы', async () => {
		await expect(notes.create(owner.id, { title: 42 })).rejects.toThrow(z.ZodError);
	});
});

describe('get', () => {
	test('возвращает свою заметку', async () => {
		const created = await createTestNote(db, owner.id);
		expect(await notes.get(owner.id, created.id)).toEqual(created);
	});

	test('чужая заметка — NotFoundError, а не доступ', async () => {
		const created = await createTestNote(db, owner.id);
		await expect(notes.get(stranger.id, created.id)).rejects.toThrow(NotFoundError);
	});

	test('id не в формате UUID — NotFoundError', async () => {
		await expect(notes.get(owner.id, 'not-a-uuid')).rejects.toThrow(NotFoundError);
	});
});

describe('list', () => {
	test('отдаёт только заметки владельца, новые сверху', async () => {
		const first = await createTestNote(db, owner.id, { title: 'Первая' });
		await Bun.sleep(5); // updatedAt с точностью до миллисекунд: без паузы порядок может совпасть
		const second = await createTestNote(db, owner.id, { title: 'Вторая' });
		await createTestNote(db, stranger.id, { title: 'Чужая' });

		const list = await notes.list(owner.id);
		expect(list.map((note) => note.id)).toEqual([second.id, first.id]);
	});

	test('учитывает limit', async () => {
		await createTestNote(db, owner.id, { title: 'Первая' });
		await createTestNote(db, owner.id, { title: 'Вторая' });
		expect(await notes.list(owner.id, { limit: '1' })).toHaveLength(1);
	});

	test('находит по началу слова с учётом морфологии', async () => {
		await createTestNote(db, owner.id, { title: 'Погода в Киеве' });
		await createTestNote(db, owner.id, { title: 'Список покупок' });
		const found = await notes.list(owner.id, { q: 'погод' });
		expect(found.map((note) => note.title)).toEqual(['Погода в Киеве']);
	});

	test('находит ссылку по подстроке', async () => {
		await createTestNote(db, owner.id, { content: 'https://github.com/foo/bar' });
		expect(await notes.list(owner.id, { q: 'github.com/foo' })).toHaveLength(1);
	});

	test('% и _ в запросе ищутся как обычные символы', async () => {
		await createTestNote(db, owner.id, { title: 'Скидка 50%' });
		await createTestNote(db, owner.id, { title: 'Без процентов' });
		const found = await notes.list(owner.id, { q: '%' });
		expect(found.map((note) => note.title)).toEqual(['Скидка 50%']);
	});

	test('SQL в запросе не выполняется', async () => {
		await createTestNote(db, owner.id);
		const found = await notes.list(owner.id, { q: `'; DROP TABLE "Note"; --` });
		expect(found).toEqual([]);
		expect(await notes.list(owner.id)).toHaveLength(1);
	});

	test('не ищет в чужих заметках', async () => {
		await createTestNote(db, stranger.id, { title: 'Погода' });
		expect(await notes.list(owner.id, { q: 'погода' })).toEqual([]);
	});
});

describe('update', () => {
	test('меняет свою заметку', async () => {
		const created = await createTestNote(db, owner.id, { title: 'Было' });
		const updated = await notes.update(owner.id, created.id, { title: 'Стало' });
		expect(updated.title).toBe('Стало');
	});

	test('чужую заметку не меняет', async () => {
		const created = await createTestNote(db, owner.id, { title: 'Было' });
		await expect(notes.update(stranger.id, created.id, { title: 'Взлом' })).rejects.toThrow(
			NotFoundError,
		);
		expect((await notes.get(owner.id, created.id)).title).toBe('Было');
	});
});

describe('remove', () => {
	test('удаляет свою заметку', async () => {
		const created = await createTestNote(db, owner.id);
		await notes.remove(owner.id, created.id);
		await expect(notes.get(owner.id, created.id)).rejects.toThrow(NotFoundError);
	});

	test('чужую заметку не удаляет', async () => {
		const created = await createTestNote(db, owner.id);
		await expect(notes.remove(stranger.id, created.id)).rejects.toThrow(NotFoundError);
		expect(await notes.get(owner.id, created.id)).toEqual(created);
	});
});
