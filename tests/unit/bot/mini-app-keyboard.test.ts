import { describe, expect, test } from 'bun:test';
import { miniAppKeyboard } from '#bot/keyboards/mini-app.ts';

const MINI_APP_URL = 'https://app.example.com/';

describe('miniAppKeyboard', () => {
	test('Тест кнопки открытия Mini App по адресу', () => {
		expect(miniAppKeyboard(MINI_APP_URL).inline_keyboard).toEqual([
			[{ text: 'Открыть приложение', web_app: { url: MINI_APP_URL } }],
		]);
	});
});
