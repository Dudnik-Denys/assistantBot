import { describe, expect, test } from 'bun:test';
import { shouldUseFullscreen } from '#web/lib/telegram.ts';

describe('shouldUseFullscreen', () => {
	test('Тест полноэкранного режима на iPhone и Android с поддержкой Bot API 8.0', () => {
		expect(shouldUseFullscreen('ios', true)).toBe(true);
		expect(shouldUseFullscreen('android', true)).toBe(true);
	});

	test('Тест отказа от полноэкранного режима в старом клиенте без его поддержки', () => {
		expect(shouldUseFullscreen('ios', false)).toBe(false);
	});

	test('Тест отказа от полноэкранного режима на компьютере и в веб-версии', () => {
		expect(shouldUseFullscreen('tdesktop', true)).toBe(false);
		expect(shouldUseFullscreen('macos', true)).toBe(false);
		expect(shouldUseFullscreen('weba', true)).toBe(false);
	});
});
