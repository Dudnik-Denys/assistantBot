import { SWIPE_DOWN_PX } from '#lib/constants/gestures.ts';

/** Жест — свайп вниз: палец ушёл вниз дальше порога и больше по вертикали, чем по горизонтали. */
export function isSwipeDown(deltaX: number, deltaY: number): boolean {
	return deltaY >= SWIPE_DOWN_PX && deltaY > Math.abs(deltaX);
}
