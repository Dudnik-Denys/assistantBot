/** Сдвиг пальца, после которого ясно, горизонтальный это жест (свайп) или вертикальный (прокрутка). */
const AXIS_LOCK_PX = 8;

/** Закрыть открытую строку: открыта может быть только одна. */
let closeOpened: (() => void) | null = null;

/**
 * Свайп строки влево, открывающий действия под ней (как в списках iOS).
 * Влево — открыть (если сдвинули больше чем на половину ширины действий), вправо — закрыть;
 * закрытую строку вправо не сдвинуть. Тап по открытой строке закрывает её, а не открывает ссылку.
 * Вертикальный жест не перехватывается — список прокручивается как обычно (нужен `touch-action: pan-y`).
 *
 * Создавать при инициализации компонента (в <script>); обработчики — на сдвигаемый элемент.
 *
 *   const swipe = new SwipeReveal(() => actionsWidth);
 *   <div style:--offset="{swipe.offset}px" onpointerdown={swipe.onpointerdown} …>
 */
export class SwipeReveal {
	/** Сдвиг строки в пикселях: от `-ширина действий` (открыта) до 0 (закрыта). */
	offset = $state(0);
	/** Палец ведёт строку — анимация сдвига выключена. */
	dragging = $state(false);

	#width: () => number;
	#open = false;
	#start: { x: number; y: number; offset: number } | null = null;
	#axis: 'x' | 'y' | null = null;
	#suppressClick = false;

	/** width — ширина действий в пикселях (измеряется в разметке). */
	constructor(width: () => number) {
		this.#width = width;
		$effect(() => () => {
			if (closeOpened === this.close) closeOpened = null;
		});
	}

	close = (): void => this.#settle(false);

	onpointerdown = (e: PointerEvent): void => {
		if (!e.isPrimary) return;
		this.#start = { x: e.clientX, y: e.clientY, offset: this.offset };
		this.#axis = null;
		this.#suppressClick = false;
	};

	onpointermove = (e: PointerEvent): void => {
		if (!this.#start || !e.isPrimary) return;
		const dx = e.clientX - this.#start.x;
		const dy = e.clientY - this.#start.y;
		if (!this.#axis) {
			if (Math.max(Math.abs(dx), Math.abs(dy)) < AXIS_LOCK_PX) return;
			this.#axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
			if (this.#axis === 'x') {
				if (e.currentTarget instanceof Element) e.currentTarget.setPointerCapture(e.pointerId);
				this.dragging = true;
			}
		}
		if (this.#axis !== 'x') return;
		this.offset = Math.min(0, Math.max(-this.#width(), this.#start.offset + dx));
	};

	onpointerup = (): void => {
		if (!this.#start) return;
		if (this.#axis === 'x') {
			this.#suppressClick = true;
			this.#settle(this.offset < -this.#width() / 2);
		} else if (this.#axis === null && this.#open) {
			this.#suppressClick = true;
			this.#settle(false);
		}
		this.#start = null;
		this.dragging = false;
	};

	/**
	 * Браузер забрал жест себе (началась прокрутка) или захват указателя потерян без pointerup —
	 * вернуть строку в прежнее положение. После обычного pointerup жест уже завершён (#start = null).
	 */
	onpointercancel = (): void => {
		if (!this.#start) return;
		this.#settle(this.#open);
		this.#start = null;
		this.dragging = false;
	};

	/** После свайпа или закрывающего тапа браузер всё равно шлёт click — гасим его, чтобы не открылась ссылка. */
	onclickcapture = (e: MouseEvent): void => {
		if (!this.#suppressClick) return;
		e.preventDefault();
		e.stopPropagation();
		this.#suppressClick = false;
	};

	#settle(open: boolean): void {
		this.#open = open;
		this.offset = open ? -this.#width() : 0;
		if (open) {
			if (closeOpened !== this.close) closeOpened?.();
			closeOpened = this.close;
		} else if (closeOpened === this.close) {
			closeOpened = null;
		}
	}
}
