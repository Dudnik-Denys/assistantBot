import { describe, expect, test } from 'bun:test';
import { SWIPE_DOWN_PX } from '#web/lib/constants/gestures.ts';
import { isSwipeDown } from '#web/lib/utils/gestures.ts';

describe('isSwipeDown', () => {
	test('Тест признания свайпом движения вниз ровно на порог', () => {
		expect(isSwipeDown(0, SWIPE_DOWN_PX)).toBe(true);
	});

	test('Тест отказа считать свайпом движение вниз на пиксель меньше порога (случайный жест, подтяг списка)', () => {
		expect(isSwipeDown(0, SWIPE_DOWN_PX - 1)).toBe(false);
	});

	test('Тест отказа считать свайпом вниз движение вверх: клавиатура остаётся', () => {
		expect(isSwipeDown(0, -SWIPE_DOWN_PX)).toBe(false);
	});

	test('Тест отказа считать свайпом вниз диагональ под 45°: вертикаль должна быть больше горизонтали', () => {
		expect(isSwipeDown(SWIPE_DOWN_PX, SWIPE_DOWN_PX)).toBe(false);
		expect(isSwipeDown(-SWIPE_DOWN_PX, SWIPE_DOWN_PX)).toBe(false);
	});

	test('Тест признания свайпом движения вниз чуть больше, чем вбок', () => {
		expect(isSwipeDown(SWIPE_DOWN_PX, SWIPE_DOWN_PX + 1)).toBe(true);
	});
});
