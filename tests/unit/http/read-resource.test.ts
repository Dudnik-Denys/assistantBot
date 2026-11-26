import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test';
import { HttpStatus } from '#web/lib/constants/http-status.ts';
import { HttpClient, ResponseFormatError } from '#web/lib/http/client.ts';
import { ReadResource, type ResourceOptions } from '#web/lib/http/read-resource.ts';
import { API_BASE_URL, FAKE_ORIGIN } from '../../constants/http.ts';
import { createFakeFetch } from '../../helpers/fake-fetch.ts';
import { FakeItemDtoSchema, type FakeItemDto as ItemDto } from '../../schemas/fake-api.ts';

const PATH = '/items';
const FIRST = { id: '1', title: 'Первая' };
const SECOND = { id: '2', title: 'Вторая' };
const THIRD = { id: '3', title: 'Третья' };

/**
 * Наследник с открытым `cacheItem` — так нестандартные действия (`CountersApi.increment`)
 * кладут изменённую запись в кеш.
 */
class TestResource extends ReadResource<ItemDto> {
	update(item: ItemDto): void {
		this.cacheItem(item);
	}
}

/** API только для чтения: список (поиск по подстроке), элемент, удаление; `bad` — ответ не по схеме. */
function createFakeApi(items: ItemDto[]) {
	return createFakeFetch(({ url, init }) => {
		const { pathname, searchParams } = new URL(url, FAKE_ORIGIN);
		if (pathname === `${API_BASE_URL}${PATH}`) {
			const searchQuery = searchParams.get('q') ?? '';
			return Response.json(items.filter((item) => item.title.includes(searchQuery)));
		}
		const id = pathname.slice(`${API_BASE_URL}${PATH}/`.length);
		if (id === 'bad') return Response.json({ id: 'bad' });
		if (init.method === 'DELETE') return new Response(null, { status: HttpStatus.NoContent });
		return Response.json(items.find((item) => item.id === id));
	});
}

let fake: ReturnType<typeof createFakeApi>;
let fetchSpy: ReturnType<typeof spyOn>;

function createResource(options: ResourceOptions = {}): TestResource {
	return new TestResource(new HttpClient(API_BASE_URL), PATH, FakeItemDtoSchema, options);
}

beforeEach(() => {
	fake = createFakeApi([THIRD, SECOND, FIRST]);
	fetchSpy = spyOn(globalThis, 'fetch').mockImplementation(fake.fetch);
});

afterEach(() => {
	fetchSpy.mockRestore();
});

describe('list', () => {
	test('Общий список сохраняется в кеш', async () => {
		const resource = createResource();
		expect(resource.cachedList).toBeNull();
		const items = await resource.list();
		expect(items).toEqual([THIRD, SECOND, FIRST]);
		expect(resource.cachedList).toEqual(items);
	});

	test('Результат поиска не заменяет кеш', async () => {
		const resource = createResource();
		await resource.list();
		expect(await resource.list('Втор')).toEqual([SECOND]);
		expect(resource.cachedList).toEqual([THIRD, SECOND, FIRST]);
	});

	test('Поисковый запрос кодируется в адресе', async () => {
		await createResource().list('a&b');
		expect(fake.calls[0]?.url).toBe(`${API_BASE_URL}${PATH}?q=a%26b`);
	});
});

describe('get', () => {
	test('Элемент по id', async () => {
		expect(await createResource().get(SECOND.id)).toEqual(SECOND);
	});

	test('Выброс ResponseFormatError для ответа не по схеме', async () => {
		await expect(createResource().get('bad')).rejects.toThrow(ResponseFormatError);
	});
});

describe('remove', () => {
	test('Удалённый элемент убирается из кеша', async () => {
		const resource = createResource();
		await resource.list();
		await resource.remove(SECOND.id);
		expect(fake.calls.at(-1)?.init.method).toBe('DELETE');
		expect(resource.cachedList).toEqual([THIRD, FIRST]);
	});
});

describe('cacheItem', () => {
	const changed = { ...FIRST, title: 'Изменена' };

	test('Изменённый элемент — в начало кеша', async () => {
		const resource = createResource();
		await resource.list();
		resource.update(changed);
		expect(resource.cachedList).toEqual([changed, THIRD, SECOND]);
	});

	test('При stableOrder изменённый элемент остаётся на своём месте', async () => {
		const resource = createResource({ stableOrder: true });
		await resource.list();
		resource.update(changed);
		expect(resource.cachedList).toEqual([THIRD, SECOND, changed]);
	});

	test('До загрузки списка кеш не создаётся', () => {
		const resource = createResource();
		resource.update(changed);
		expect(resource.cachedList).toBeNull();
	});
});
