import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test';
import { HttpStatus } from '#web/lib/constants/http-status.ts';
import { ApiError, HttpClient } from '#web/lib/http/client.ts';
import { RestResource } from '#web/lib/http/rest-resource.ts';
import { API_BASE_URL, FAKE_ORIGIN } from '../../constants/http.ts';
import { createFakeFetch } from '../../helpers/fake-fetch.ts';
import {
	FakeItemDtoSchema,
	type FakeItemInput,
	FakeItemInputSchema,
	type FakeItemDto as ItemDto,
} from '../../schemas/fake-api.ts';

const PATH = '/items';

/**
 * API в памяти по REST-соглашению проекта: список от новых к старым (как у сервисов core),
 * поиск — по подстроке заголовка, неизвестный id — 404 в формате нашего API.
 */
function createFakeApi(initial: ItemDto[]) {
	let items = [...initial];
	let nextId = initial.length + 1;
	const notFound = () =>
		Response.json({ error: 'Запись не найдена' }, { status: HttpStatus.NotFound });

	return createFakeFetch(async ({ url, init }) => {
		const { pathname, searchParams } = new URL(url, FAKE_ORIGIN);
		const method = init.method ?? 'GET';
		// Разбор строки — до схемы; дальше идут только проверенные данные.
		const input = init.body
			? FakeItemInputSchema.parse(JSON.parse(String(init.body)))
			: { title: '' };

		if (pathname === `${API_BASE_URL}${PATH}`) {
			if (method === 'POST') {
				const created = { id: String(nextId++), ...input };
				items = [created, ...items];
				return Response.json(created, { status: HttpStatus.Created });
			}
			const searchQuery = searchParams.get('q') ?? '';
			return Response.json(items.filter((item) => item.title.includes(searchQuery)));
		}

		const id = pathname.slice(`${API_BASE_URL}${PATH}/`.length);
		const existing = items.find((item) => item.id === id);
		if (!existing) return notFound();
		if (method === 'DELETE') {
			items = items.filter((item) => item !== existing);
			return new Response(null, { status: HttpStatus.NoContent });
		}
		const updated = { ...existing, ...input };
		items = [updated, ...items.filter((item) => item !== existing)];
		return Response.json(updated);
	});
}

const FIRST = { id: '1', title: 'Первая' };
const SECOND = { id: '2', title: 'Вторая' };

let resource: RestResource<ItemDto, FakeItemInput>;
let fetchSpy: ReturnType<typeof spyOn>;

beforeEach(() => {
	fetchSpy = spyOn(globalThis, 'fetch').mockImplementation(createFakeApi([SECOND, FIRST]).fetch);
	resource = new RestResource<ItemDto, FakeItemInput>(
		new HttpClient(API_BASE_URL),
		PATH,
		FakeItemDtoSchema,
	);
});

afterEach(() => {
	// Восстановить настоящий fetch: подмена не должна протекать в другие тесты.
	fetchSpy.mockRestore();
});

describe('cachedList', () => {
	test('Тест отсутствия кеша до первой загрузки списка', () => {
		expect(resource.cachedList).toBeNull();
	});

	test('Тест кеширования общего списка', async () => {
		const list = await resource.list();
		expect(resource.cachedList).toEqual(list);
		expect(list).toEqual([SECOND, FIRST]);
	});

	test('Тест сохранения общего списка в кеше после поиска', async () => {
		await resource.list();
		const found = await resource.list('Перв');
		expect(found).toEqual([FIRST]);
		expect(resource.cachedList).toEqual([SECOND, FIRST]);
	});

	test('Тест добавления созданной записи в начало кеша', async () => {
		await resource.list();
		const created = await resource.create({ title: 'Третья' });
		expect(resource.cachedList).toEqual([created, SECOND, FIRST]);
	});

	test('Тест переноса изменённой записи в начало кеша без дубля', async () => {
		await resource.list();
		const updated = await resource.update(FIRST.id, { title: 'Первая, изменённая' });
		expect(resource.cachedList).toEqual([updated, SECOND]);
	});

	test('Тест удаления записи из кеша', async () => {
		await resource.list();
		await resource.remove(SECOND.id);
		expect(resource.cachedList).toEqual([FIRST]);
	});

	test('Тест отсутствия кеша после изменений без загрузки списка', async () => {
		await resource.create({ title: 'Третья' });
		expect(resource.cachedList).toBeNull();
	});

	test('Тест неизменности кеша при ошибке запроса', async () => {
		await resource.list();
		await expect(resource.remove('404')).rejects.toThrow(ApiError);
		await expect(resource.update('404', { title: 'Нет такой' })).rejects.toThrow(ApiError);
		expect(resource.cachedList).toEqual([SECOND, FIRST]);
	});
});
