import { describe, expect, test } from 'bun:test';
import { InitDataError, NotFoundError, ValidationError } from '@tgab/core';
import type { User } from '@tgab/db';
import { INVALID_JSON_MESSAGE } from '#web/lib/constants/errors.ts';
import { HttpStatus } from '#web/lib/constants/http-status.ts';
import {
	collectionCreate,
	errorResponse,
	HttpStatusError,
	handleApi,
	readJson,
	recordAction,
	recordDelete,
	recordUpdate,
	requireUser,
} from '#web/lib/server/http.ts';
import { FAKE_ALLOWED_USER } from '../../constants/bot.ts';

// Перевод ошибок в HTTP и обёртки эндпоинтов Mini App (`apps/web/src/lib/server/http.ts`).

const RECORD_ID = 'record-1';
const INPUT = { title: 'Покупки' };

type Locals = Parameters<typeof requireUser>[0];

/** `locals` хука: пользователь после проверки `initData` или без него (не авторизован). */
function locals(user: User | null = FAKE_ALLOWED_USER): Locals {
	return { user } as Locals;
}

function jsonRequest(body: string): Request {
	return new Request('http://localhost/api/notes', { method: 'POST', body });
}

describe('errorResponse', () => {
	test('Тест перевода доменных ошибок в коды по таблице', async () => {
		const cases = [
			[new InitDataError('Подпись неверна'), HttpStatus.Unauthorized],
			[new NotFoundError('Заметка не найдена'), HttpStatus.NotFound],
			[new ValidationError('Укажите название'), HttpStatus.BadRequest],
		] as const;
		for (const [error, status] of cases) {
			const response = errorResponse(error);
			expect(response.status).toBe(status);
			expect(await response.json()).toEqual({ error: error.message });
		}
	});

	test('Тест ответа HttpStatusError с его кодом и дополнительными полями', async () => {
		const response = errorResponse(
			new HttpStatusError(HttpStatus.Forbidden, 'Нет доступа', { telegramId: '1' }),
		);
		expect(response.status).toBe(HttpStatus.Forbidden);
		expect(await response.json()).toEqual({ telegramId: '1', error: 'Нет доступа' });
	});

	test('Тест проброса неизвестной ошибки дальше (500 от SvelteKit)', () => {
		const error = new Error('Сбой');
		expect(() => errorResponse(error)).toThrow(error);
	});
});

describe('handleApi', () => {
	test('Тест ответа обработчика без изменений и ошибки — через errorResponse', async () => {
		const ok = await handleApi(async () => Response.json(INPUT));
		expect(await ok.json()).toEqual(INPUT);
		const failed = await handleApi(async () => {
			throw new NotFoundError();
		});
		expect(failed.status).toBe(HttpStatus.NotFound);
	});
});

describe('requireUser', () => {
	test('Тест возврата пользователя и 401 без него', () => {
		expect(requireUser(locals())).toBe(FAKE_ALLOWED_USER);
		expect(() => requireUser(locals(null))).toThrow(HttpStatusError);
	});
});

describe('readJson', () => {
	test('Тест разбора тела и 400 для тела не в JSON', async () => {
		expect(await readJson(jsonRequest(JSON.stringify(INPUT)))).toEqual(INPUT);
		const error = await readJson(jsonRequest('{')).catch((caught: unknown) => caught);
		expect(error).toBeInstanceOf(HttpStatusError);
		expect(error).toMatchObject({ status: HttpStatus.BadRequest, message: INVALID_JSON_MESSAGE });
	});
});

describe('обёртки эндпоинтов', () => {
	const params = { id: RECORD_ID };

	test('Тест recordAction: вызов с id пользователя и записи, ответ — DTO', async () => {
		const handler = recordAction(async (userId, id) => ({ userId, id }));
		const response = await handler({ locals: locals(), params });
		expect(await response.json()).toEqual({ userId: FAKE_ALLOWED_USER.id, id: RECORD_ID });
	});

	test('Тест recordUpdate: тело запроса в сервис, ответ — DTO', async () => {
		const handler = recordUpdate(async (userId, id, input) => ({ userId, id, input }));
		const response = await handler({
			locals: locals(),
			params,
			request: jsonRequest(JSON.stringify(INPUT)),
		});
		expect(await response.json()).toEqual({
			userId: FAKE_ALLOWED_USER.id,
			id: RECORD_ID,
			input: INPUT,
		});
	});

	test('Тест recordDelete: 204 без тела', async () => {
		const removed: string[] = [];
		const handler = recordDelete(async (_userId, id) => {
			removed.push(id);
		});
		const response = await handler({ locals: locals(), params });
		expect(response.status).toBe(HttpStatus.NoContent);
		expect(await response.text()).toBe('');
		expect(removed).toEqual([RECORD_ID]);
	});

	test('Тест collectionCreate: 201 и созданный DTO', async () => {
		const handler = collectionCreate(async (userId, input) => ({ userId, input }));
		const response = await handler({
			locals: locals(),
			request: jsonRequest(JSON.stringify(INPUT)),
		});
		expect(response.status).toBe(HttpStatus.Created);
		expect(await response.json()).toEqual({ userId: FAKE_ALLOWED_USER.id, input: INPUT });
	});

	test('Тест 401 до чтения тела, если пользователя нет', async () => {
		const handler = collectionCreate(async () => INPUT);
		const response = await handler({ locals: locals(null), request: jsonRequest('{') });
		expect(response.status).toBe(HttpStatus.Unauthorized);
	});
});
