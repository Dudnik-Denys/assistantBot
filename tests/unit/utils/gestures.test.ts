import { describe, expect, test } from 'bun:test';
import { SWIPE_DOWN_PX } from '#web/lib/constants/gestures.ts';
import { isSwipeDown } from '#web/lib/utils/gestures.ts';

describe('isSwipeDown', () => {
	test('Свайп вниз ровно на порог', () => {
		expect(isSwipeDown(0, SWIPE_DOWN_PX)).toBe(true);
	});

	test('Движение вниз на пиксель меньше порога — не свайп (случайный жест, подтяг списка)', () => {
		expect(isSwipeDown(0, SWIPE_DOWN_PX - 1)).toBe(false);
	});

	test('Движение вверх — не свайп вниз: клавиатура остаётся', () => {
		expect(isSwipeDown(0, -SWIPE_DOWN_PX)).toBe(false);
	});

	test('Диагональ под 45° — не свайп вниз: вертикаль должна быть больше горизонтали', () => {
		expect(isSwipeDown(SWIPE_DOWN_PX, SWIPE_DOWN_PX)).toBe(false);
		expect(isSwipeDown(-SWIPE_DOWN_PX, SWIPE_DOWN_PX)).toBe(false);
	});

	test('Вниз чуть больше, чем вбок, — свайп', () => {
		expect(isSwipeDown(SWIPE_DOWN_PX, SWIPE_DOWN_PX + 1)).toBe(true);
	});
});
