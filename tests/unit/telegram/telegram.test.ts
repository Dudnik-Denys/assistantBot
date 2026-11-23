import { describe, expect, test } from 'bun:test';
import { shouldUseFullscreen } from '#web/lib/telegram.ts';

describe('shouldUseFullscreen', () => {
	test('На весь экран на iPhone и Android с поддержкой Bot API 8.0', () => {
		expect(shouldUseFullscreen('ios', true)).toBe(true);
		expect(shouldUseFullscreen('android', true)).toBe(true);
	});

	test('Не на весь экран в старом клиенте без полноэкранного режима', () => {
		expect(shouldUseFullscreen('ios', false)).toBe(false);
	});

	test('Не на весь экран на компьютере и в веб-версии', () => {
		expect(shouldUseFullscreen('tdesktop', true)).toBe(false);
		expect(shouldUseFullscreen('macos', true)).toBe(false);
		expect(shouldUseFullscreen('weba', true)).toBe(false);
	});
});
