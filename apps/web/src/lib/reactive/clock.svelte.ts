import { CLOCK_TICK_MS } from '#lib/constants/delays.ts';

/**
 * Текущее время, которое обновляется само (раз в `tickMs`): для обратного отсчёта на экране.
 * Создавать при инициализации компонента (в <script>): таймер живёт, пока жив компонент.
 *
 *   const clock = new Clock();
 *   const left = $derived(target - clock.now);
 */
export class Clock {
	/** Текущее время, мс (как `Date.now()`). */
	now = $state(Date.now());

	constructor(tickMs = CLOCK_TICK_MS) {
		$effect(() => {
			const timer = setInterval(() => {
				this.now = Date.now();
			}, tickMs);
			return () => clearInterval(timer);
		});
	}
}
