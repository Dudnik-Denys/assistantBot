import { AXIS_LOCK_PX } from '#lib/constants/gestures.ts';

/** Открытая строка (может быть только одна) — её закрытие и элемент. */
let opened: { close: () => void; element: () => HTMLElement | undefined } | null = null;

/**
 * Касание закрыло открытую строку — тап по другой строке не должен открыть её ссылку.
 * Сбрасывается в следующей задаче: pointerdown строки приходит в том же событии, сразу после.
 */
let closedByPointer = false;

/**
 * Любое касание вне открытой строки закрывает её (как в Заметках iOS).
 * Слушатель на документе в фазе перехвата — раньше обработчиков самих строк.
 */
function onDocumentPointerDown(event: PointerEvent): void {
	if (!opened) return;
	const element = opened.element();
	if (element && event.target instanceof Node && element.contains(event.target)) return;
	opened.close();
	closedByPointer = true;
	setTimeout(() => (closedByPointer = false));
}

/**
 * Свайп строки влево, выдвигающий действия справа от неё (как в списках iOS).
 * Влево — открыть (если сдвинули больше чем на половину ширины действий), вправо — закрыть;
 * закрытую строку вправо не сдвинуть. Открытая строка остаётся открытой, пока её не закроют:
 * свайпом вправо, тапом по ней, касанием другой строки или любого места экрана, прокруткой.
 * Тап, который закрыл строку, ссылку не открывает.
 * Вертикальный жест не перехватывается — список
 * прокручивается как обычно (нужен `touch-action: pan-y`).
 *
 * Создавать при инициализации компонента (в <script>). Сдвиг (`offset`) — на ряд «содержимое +
 * действия», обработчики указателя — только на содержимое: касание кнопок действий — не жест.
 *
 *   const swipe = new SwipeReveal(() => actionsWidth, () => rowElement);
 *   <div style:--offset="{swipe.offset}px" onpointerdown={swipe.onpointerdown} …>
 */
export class SwipeReveal {
	/** Сдвиг строки в пикселях: от `-ширина действий` (открыта) до 0 (закрыта). */
	offset = $state(0);
	/** Палец ведёт строку — анимация сдвига выключена. */
	dragging = $state(false);

	#width: () => number;
	#element: () => HTMLElement | undefined;
	#open = false;
	#start: { x: number; y: number; offset: number } | null = null;
	#axis: 'x' | 'y' | null = null;
	#suppressClick = false;

	/** width — ширина действий в пикселях, element — вся строка (измеряются в разметке). */
	constructor(width: () => number, element: () => HTMLElement | undefined) {
		this.#width = width;
		this.#element = element;
		$effect(() => () => this.#settle(false));
	}

	close = (): void => this.#settle(false);

	onpointerdown = (event: PointerEvent): void => {
		if (!event.isPrimary) return;
		this.#start = { x: event.clientX, y: event.clientY, offset: this.offset };
		this.#axis = null;
		// Это касание закрыло другую строку — по нему не переходим.
		this.#suppressClick = closedByPointer;
	};

	onpointermove = (event: PointerEvent): void => {
		if (!this.#start || !event.isPrimary) return;
		const deltaX = event.clientX - this.#start.x;
		const deltaY = event.clientY - this.#start.y;
		if (!this.#axis) {
			if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < AXIS_LOCK_PX) return;
			this.#axis = Math.abs(deltaX) > Math.abs(deltaY) ? 'x' : 'y';
			if (this.#axis === 'y') {
				// Прокрутка закрывает открытую строку, как в iOS.
				if (this.#open) this.#settle(false);
				return;
			}
			this.dragging = true;
			// Для мыши — чтобы строка не «отпускалась», когда курсор уходит с неё. Касание
			// браузер и так закрепляет за элементом под пальцем.
			if (event.pointerType === 'mouse' && event.currentTarget instanceof Element) {
				event.currentTarget.setPointerCapture(event.pointerId);
			}
		}
		if (this.#axis !== 'x') return;
		this.offset = Math.min(0, Math.max(-this.#width(), this.#start.offset + deltaX));
	};

	onpointerup = (): void => {
		if (!this.#start) return;
		if (this.#axis === 'x') {
			this.#suppressClick = true;
			this.#settle(this.offset < -this.#width() / 2);
		} else if (this.#axis === null && this.#open) {
			// Тап по открытой строке закрывает её.
			this.#suppressClick = true;
			this.#settle(false);
		}
		this.#start = null;
		this.dragging = false;
	};

	/** Браузер забрал жест себе (началась прокрутка) — вернуть строку в прежнее положение. */
	onpointercancel = (): void => {
		if (!this.#start) return;
		this.#settle(this.#open);
		this.#start = null;
		this.dragging = false;
	};

	/**
	 * После свайпа или закрывающего тапа браузер всё равно шлёт click —
	 * гасим его, чтобы не открылась ссылка.
	 */
	onclickcapture = (event: MouseEvent): void => {
		if (!this.#suppressClick) return;
		event.preventDefault();
		event.stopPropagation();
		this.#suppressClick = false;
	};

	#settle(open: boolean): void {
		this.#open = open;
		this.offset = open ? -this.#width() : 0;
		if (open) {
			if (opened && opened.close !== this.close) opened.close();
			if (!opened) document.addEventListener('pointerdown', onDocumentPointerDown, true);
			opened = { close: this.close, element: this.#element };
		} else if (opened?.close === this.close) {
			opened = null;
			document.removeEventListener('pointerdown', onDocumentPointerDown, true);
		}
	}
}
