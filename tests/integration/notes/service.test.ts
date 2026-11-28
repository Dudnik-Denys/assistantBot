import { afterAll, beforeEach, describe, expect, test } from 'bun:test';
import { createNotesService, NotFoundError, ValidationError } from '@tgab/core';
import type { User } from '@tgab/db';
import { LIST_LIMIT_MAX, SEARCH_QUERY_MAX } from '#core/constants/list.ts';
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
	test('Тест возврата DTO с обрезанными пробелами и датами-строками', async () => {
		const note = await notes.create(owner.id, { title: '  Покупки  ', content: ' молоко ' });
		expect(note).toMatchObject({ title: 'Покупки', content: 'молоко' });
		expect(typeof note.createdAt).toBe('string');
		expect(Object.keys(note).sort()).toEqual(['content', 'createdAt', 'id', 'title', 'updatedAt']);
	});

	test('Тест отклонения заметки без заголовка', async () => {
		await expect(notes.create(owner.id, { title: ' ', content: 'Текст' })).rejects.toThrow(
			ValidationError,
		);
	});

	test('Тест отклонения ввода не той формы', async () => {
		await expect(notes.create(owner.id, { title: 42 })).rejects.toThrow(ValidationError);
	});
});

describe('get', () => {
	test('Тест возврата своей заметки', async () => {
		const created = await createTestNote(db, owner.id);
		expect(await notes.get(owner.id, created.id)).toEqual(created);
	});

	test('Тест выброса NotFoundError для чужой заметки вместо доступа к ней', async () => {
		const created = await createTestNote(db, owner.id);
		await expect(notes.get(stranger.id, created.id)).rejects.toThrow(NotFoundError);
	});

	test('Тест выброса NotFoundError для id не в формате UUID', async () => {
		await expect(notes.get(owner.id, 'not-a-uuid')).rejects.toThrow(NotFoundError);
	});
});

describe('list', () => {
	test('Тест выдачи только заметок владельца, новые сверху', async () => {
		const first = await createTestNote(db, owner.id, { title: 'Первая' });
		await Bun.sleep(5); // updatedAt с точностью до миллисекунд: без паузы порядок может совпасть
		const second = await createTestNote(db, owner.id, { title: 'Вторая' });
		await createTestNote(db, stranger.id, { title: 'Чужая' });

		const list = await notes.list(owner.id);
		expect(list.map((note) => note.id)).toEqual([second.id, first.id]);
	});

	test('Тест отклонения некорректных параметров списка', async () => {
		for (const query of [{ limit: '0' }, { limit: 'abc' }, { limit: String(LIST_LIMIT_MAX + 1) }]) {
			await expect(notes.list(owner.id, query)).rejects.toThrow(ValidationError);
		}
		await expect(notes.list(owner.id, { q: 'а'.repeat(SEARCH_QUERY_MAX + 1) })).rejects.toThrow(
			ValidationError,
		);
	});

	test('Тест учёта limit', async () => {
		await createTestNote(db, owner.id, { title: 'Первая' });
		await createTestNote(db, owner.id, { title: 'Вторая' });
		expect(await notes.list(owner.id, { limit: '1' })).toHaveLength(1);
	});

	test('Тест поиска по началу слова с учётом морфологии', async () => {
		await createTestNote(db, owner.id, { title: 'Погода в Киеве' });
		await createTestNote(db, owner.id, { title: 'Список покупок' });
		const found = await notes.list(owner.id, { q: 'погод' });
		expect(found.map((note) => note.title)).toEqual(['Погода в Киеве']);
	});

	test('Тест поиска по подстроке заголовка', async () => {
		await createTestNote(db, owner.id, { title: 'github.com/foo/bar' });
		expect(await notes.list(owner.id, { q: 'github.com/foo' })).toHaveLength(1);
	});

	test('Тест поиска только по заголовку, без текста', async () => {
		await createTestNote(db, owner.id, { title: 'Ссылки', content: 'Погода https://github.com' });
		expect(await notes.list(owner.id, { q: 'погода' })).toEqual([]);
		expect(await notes.list(owner.id, { q: 'github' })).toEqual([]);
	});

	test('Тест поиска % и _ как обычных символов', async () => {
		await createTestNote(db, owner.id, { title: 'Скидка 50%' });
		await createTestNote(db, owner.id, { title: 'Без процентов' });
		const found = await notes.list(owner.id, { q: '%' });
		expect(found.map((note) => note.title)).toEqual(['Скидка 50%']);
	});

	test('Тест защиты от выполнения SQL из поискового запроса', async () => {
		await createTestNote(db, owner.id);
		const found = await notes.list(owner.id, { q: `'; DROP TABLE "Note"; --` });
		expect(found).toEqual([]);
		expect(await notes.list(owner.id)).toHaveLength(1);
	});

	test('Тест исключения чужих заметок из поиска', async () => {
		await createTestNote(db, stranger.id, { title: 'Погода' });
		expect(await notes.list(owner.id, { q: 'погода' })).toEqual([]);
	});
});

describe('update', () => {
	test('Тест изменения своей заметки', async () => {
		const created = await createTestNote(db, owner.id, { title: 'Было' });
		const updated = await notes.update(owner.id, created.id, { title: 'Стало' });
		expect(updated.title).toBe('Стало');
	});

	test('Тест запрета изменения чужой заметки', async () => {
		const created = await createTestNote(db, owner.id, { title: 'Было' });
		await expect(notes.update(stranger.id, created.id, { title: 'Взлом' })).rejects.toThrow(
			NotFoundError,
		);
		expect((await notes.get(owner.id, created.id)).title).toBe('Было');
	});

	test('Тест отклонения некорректного ввода без изменения заметки', async () => {
		const created = await createTestNote(db, owner.id, { title: 'Было' });
		await expect(notes.update(owner.id, created.id, { title: ' ' })).rejects.toThrow(
			ValidationError,
		);
		expect((await notes.get(owner.id, created.id)).title).toBe('Было');
	});

	test('Тест выброса NotFoundError для id не в формате UUID', async () => {
		await expect(notes.update(owner.id, 'not-a-uuid', { title: 'Т' })).rejects.toThrow(
			NotFoundError,
		);
	});
});

describe('remove', () => {
	test('Тест удаления своей заметки', async () => {
		const created = await createTestNote(db, owner.id);
		await notes.remove(owner.id, created.id);
		await expect(notes.get(owner.id, created.id)).rejects.toThrow(NotFoundError);
	});

	test('Тест запрета удаления чужой заметки', async () => {
		const created = await createTestNote(db, owner.id);
		await expect(notes.remove(stranger.id, created.id)).rejects.toThrow(NotFoundError);
		expect(await notes.get(owner.id, created.id)).toEqual(created);
	});

	test('Тест выброса NotFoundError для id не в формате UUID', async () => {
		await expect(notes.remove(owner.id, 'not-a-uuid')).rejects.toThrow(NotFoundError);
	});
});
