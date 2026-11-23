/**
 * Флаг, который становится `true`, только если условие держится дольше задержки:
 * индикаторы загрузки не мелькают, когда ответ приходит быстро.
 *
 * Создавать при инициализации компонента (в <script>): эффект живёт, пока жив компонент.
 *
 *   const visible = new DelayedFlag(() => Boolean(navigating.to), 150);
 *   {#if visible.value}…
 */
export class DelayedFlag {
	value = $state(false);

	constructor(condition: () => boolean, delayMs: number) {
		$effect(() => {
			if (!condition()) {
				this.value = false;
				return;
			}
			const timer = setTimeout(() => (this.value = true), delayMs);
			return () => clearTimeout(timer);
		});
	}
}
