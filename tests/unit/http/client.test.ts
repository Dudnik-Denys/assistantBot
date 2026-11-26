import { describe, expect, test } from 'bun:test';
import { HttpStatus } from '#web/lib/constants/http-status.ts';
import {
	ApiError,
	HttpClient,
	NetworkError,
	ResponseFormatError,
	ServerUnavailableError,
} from '#web/lib/http/client.ts';
import { API_BASE_URL } from '../../constants/http.ts';
import { createFakeFetch } from '../../helpers/fake-fetch.ts';
import { FakeItemDtoSchema } from '../../schemas/fake-api.ts';

const ITEM = { id: '1', title: 'Покупки' };

const client = new HttpClient(API_BASE_URL);

describe('HttpClient.request', () => {
	test('Возврат тела успешного ответа, проверенного схемой', async () => {
		const fake = createFakeFetch(() => Response.json(ITEM));
		const item = await client.request('/notes/1', {
			fetchFn: fake.fetch,
			schema: FakeItemDtoSchema,
		});
		expect(item).toEqual(ITEM);
		expect(fake.calls[0]?.url).toBe(`${API_BASE_URL}/notes/1`);
	});

	test('Выброс ResponseFormatError на успешный ответ не по схеме', async () => {
		const fake = createFakeFetch(() => Response.json({ id: 1 }));
		const request = client.request('/notes/1', { fetchFn: fake.fetch, schema: FakeItemDtoSchema });
		await expect(request).rejects.toThrow(ResponseFormatError);
	});

	test('Выброс ServerUnavailableError на успешный ответ не в JSON', async () => {
		const fake = createFakeFetch(() => new Response('<html>туннель</html>'));
		const request = client.request('/notes/1', { fetchFn: fake.fetch, schema: FakeItemDtoSchema });
		await expect(request).rejects.toThrow(ServerUnavailableError);
	});

	test('Возврат undefined на ответ без тела (204)', async () => {
		const fake = createFakeFetch(() => new Response(null, { status: HttpStatus.NoContent }));
		expect(await client.request('/notes/1', { fetchFn: fake.fetch })).toBeUndefined();
	});

	test('Отправка тела как JSON с методом и заголовком Content-Type', async () => {
		const fake = createFakeFetch(() => Response.json({}));
		const body = { title: 'Покупки' };
		await client.request('/notes', { method: 'POST', body, fetchFn: fake.fetch });

		const init = fake.calls[0]?.init;
		expect(init?.method).toBe('POST');
		expect(init?.body).toBe(JSON.stringify(body));
		expect(new Headers(init?.headers).get('Content-Type')).toBe('application/json');
	});

	test('Запрос без заголовка Authorization вне Telegram', async () => {
		const fake = createFakeFetch(() => Response.json({}));
		await client.request('/user', { fetchFn: fake.fetch });
		expect(new Headers(fake.calls[0]?.init.headers).has('Authorization')).toBe(false);
	});

	test('Выброс ApiError с текстом сервера для ошибки нашего API', async () => {
		const fake = createFakeFetch(() =>
			Response.json({ error: 'Заметка не найдена' }, { status: HttpStatus.NotFound }),
		);
		const request = client.request('/notes/1', { fetchFn: fake.fetch });
		await expect(request).rejects.toThrow(ApiError);
		await expect(request).rejects.toMatchObject({
			status: HttpStatus.NotFound,
			message: 'Заметка не найдена',
		});
	});

	test('Сохранение дополнительных полей ответа в ApiError', async () => {
		const fake = createFakeFetch(() =>
			Response.json({ error: 'Нет доступа', telegramId: '42' }, { status: HttpStatus.Forbidden }),
		);
		const request = client.request('/user', { fetchFn: fake.fetch });
		await expect(request).rejects.toMatchObject({ body: { telegramId: '42' } });
	});

	test('Выброс ServerUnavailableError для ответа не от нашего API (страница туннеля)', async () => {
		const fake = createFakeFetch(
			() => new Response('<html>ERR_NGROK_3200</html>', { status: HttpStatus.NotFound }),
		);
		const request = client.request('/notes', { fetchFn: fake.fetch });
		await expect(request).rejects.toThrow(ServerUnavailableError);
		await expect(request).rejects.toMatchObject({ status: HttpStatus.NotFound });
	});

	test('Выброс ServerUnavailableError для JSON без поля error', async () => {
		const fake = createFakeFetch(() =>
			Response.json({ message: 'Internal Error' }, { status: HttpStatus.InternalServerError }),
		);
		await expect(client.request('/notes', { fetchFn: fake.fetch })).rejects.toThrow(
			ServerUnavailableError,
		);
	});

	test('Выброс NetworkError с исходной причиной, когда ответа нет', async () => {
		const cause = new TypeError('Failed to fetch');
		const fake = createFakeFetch(() => {
			throw cause;
		});
		const request = client.request('/notes', { fetchFn: fake.fetch });
		await expect(request).rejects.toThrow(NetworkError);
		await expect(request).rejects.toMatchObject({ cause });
	});

	test('Проброс отмены запроса как есть, а не как NetworkError', async () => {
		const controller = new AbortController();
		const abortError = new DOMException('Aborted', 'AbortError');
		const fake = createFakeFetch(() => {
			controller.abort();
			throw abortError;
		});
		const request = client.request('/notes', { signal: controller.signal, fetchFn: fake.fetch });
		await expect(request).rejects.toBe(abortError);
	});
});
