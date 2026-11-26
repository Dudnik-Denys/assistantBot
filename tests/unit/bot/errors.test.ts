import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test';
import { BotError, GrammyError, HttpError } from 'grammy';
import type { ApiError } from 'grammy/types';
import type { BotContext } from '#bot/context.ts';
import { handleBotError } from '#bot/errors.ts';

const UPDATE_ID = 42;
const FORBIDDEN: ApiError = {
	ok: false,
	error_code: 403,
	description: 'Forbidden: bot was blocked by the user',
};

let errorSpy: ReturnType<typeof spyOn>;

beforeEach(() => {
	errorSpy = spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
	errorSpy.mockRestore();
});

/** Ошибка обработки апдейта; из контекста обработчик читает только `update.update_id`. */
function botError(error: unknown): BotError<BotContext> {
	const ctx = { update: { update_id: UPDATE_ID } } as unknown as BotContext;
	return new BotError(error, ctx);
}

describe('handleBotError', () => {
	test('Ошибка Telegram API — с описанием от Telegram', () => {
		const error = new GrammyError('Call failed', FORBIDDEN, 'sendMessage', {});
		handleBotError(botError(error));
		expect(errorSpy).toHaveBeenCalledWith(
			`Telegram API error (update ${UPDATE_ID}):`,
			FORBIDDEN.description,
		);
	});

	test('Ошибка сети — с исходной ошибкой', () => {
		const cause = new Error('ECONNRESET');
		handleBotError(botError(new HttpError('Network request failed', cause)));
		expect(errorSpy).toHaveBeenCalledWith(`Network error (update ${UPDATE_ID}):`, cause);
	});

	test('Прочая ошибка — целиком', () => {
		const error = new Error('Ошибка в обработчике');
		handleBotError(botError(error));
		expect(errorSpy).toHaveBeenCalledWith(`Error (update ${UPDATE_ID}):`, error);
	});
});
