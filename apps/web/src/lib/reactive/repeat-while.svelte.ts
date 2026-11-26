import { untrack } from 'svelte';

/**
 * Действие, которое выполняется, пока условие истинно: сразу, как условие стало истинным, и
 * затем раз в `intervalMs`, пока оно не станет ложным. Ошибка действия не прерывает повторы —
 * следующий раз попробует снова (нет связи, запись занята другим процессом).
 * Создавать при инициализации компонента (в <script>): эффект живёт, пока жив компонент.
 *
 *   new RepeatWhile(() => isDue(counter, clock.now), () => api.counters.finish(id), 3_000);
 *
 * Действие выполняется вне отслеживания (`untrack`): состояние, которое оно читает и меняет
 * (например, подставляет ответ сервера), не перезапускает повторы — иначе, пока условие
 * истинно, запросы шли бы друг за другом без паузы.
 */
export class RepeatWhile {
	constructor(active: () => boolean, action: () => Promise<unknown>, intervalMs: number) {
		$effect(() => {
			if (!active()) return;
			const run = () => {
				untrack(action).catch(() => {});
			};
			run();
			const timer = setInterval(run, intervalMs);
			return () => clearInterval(timer);
		});
	}
}
