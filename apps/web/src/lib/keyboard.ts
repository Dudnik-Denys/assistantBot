import { HOLD_TIMEOUT_MS } from '#lib/constants/keyboard.ts';
import { isSwipeDown } from '#lib/utils/gestures.ts';

/**
 * Свайп вниз в любом месте экрана закрывает экранную клавиатуру (как в Сообщениях iOS):
 * в Telegram на iOS она сама не закрывается ни свайпом, ни прокруткой — снимаем фокус с поля.
 * Свайп вверх клавиатуру не трогает. Использовать внутри $effect: возвращает функцию очистки.
 */
export function dismissKeyboardOnSwipeDown(): () => void {
	let start: { x: number; y: number } | null = null;

	function onTouchStart(event: TouchEvent): void {
		const touch = event.touches[0];
		// второй палец (масштаб) — не свайп
		start = event.touches.length === 1 && touch ? { x: touch.clientX, y: touch.clientY } : null;
	}

	function onTouchMove(event: TouchEvent): void {
		const touch = event.touches[0];
		if (!start || !touch) return;
		if (!isSwipeDown(touch.clientX - start.x, touch.clientY - start.y)) return;
		start = null;
		const focused = document.activeElement;
		if (focused instanceof HTMLInputElement || focused instanceof HTMLTextAreaElement) {
			focused.blur();
		}
	}

	const options = { passive: true, capture: true };
	document.addEventListener('touchstart', onTouchStart, options);
	document.addEventListener('touchmove', onTouchMove, options);
	return () => {
		document.removeEventListener('touchstart', onTouchStart, options);
		document.removeEventListener('touchmove', onTouchMove, options);
	};
}

/** Невидимое поле, которое держит клавиатуру открытой, пока открывается следующий экран. */
let keyboardHolder: HTMLInputElement | null = null;

function releaseKeyboardHolder(): void {
	keyboardHolder?.remove();
	keyboardHolder = null;
}

/**
 * Открыть клавиатуру заранее — вызывать в обработчике касания, которое ведёт на экран с полем
 * ввода (кнопка «+» → новая заметка). iOS показывает клавиатуру только при фокусе внутри
 * обработчика касания, а focus() после перехода на новый экран игнорирует. Поэтому фокус сразу
 * ставится на невидимое поле, а `focusField` на новом экране переносит его в нужное поле.
 */
export function holdKeyboard(): void {
	releaseKeyboardHolder();
	const holder = document.createElement('input');
	holder.tabIndex = -1;
	holder.setAttribute('aria-hidden', 'true');
	// text-base (16px): с меньшим шрифтом iOS увеличивает страницу при фокусе
	holder.className = 'pointer-events-none fixed top-0 left-0 size-px text-base opacity-0';
	document.body.append(holder);
	holder.focus();
	keyboardHolder = holder;
	// экран с полем не открылся — не держать клавиатуру
	setTimeout(() => {
		if (keyboardHolder === holder) releaseKeyboardHolder();
	}, HOLD_TIMEOUT_MS);
}

/** Фокус в поле; клавиатура, открытая `holdKeyboard`, переходит к нему. */
export function focusField(field: HTMLElement): void {
	field.focus();
	releaseKeyboardHolder();
}
