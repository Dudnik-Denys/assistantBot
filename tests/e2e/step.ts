import { AsyncLocalStorage } from 'node:async_hooks';
import { type TestInfo, test } from '@playwright/test';

/** Номер последнего шага верхнего уровня в каждом тесте. */
const stepNumbers = new WeakMap<TestInfo, number>();
/** Внутри шага — вложенные шаги не нумеруются. */
const insideStep = new AsyncLocalStorage<true>();

/**
 * Шаг теста (`e2e.md`, «Шаги»): шаги верхнего уровня нумеруются сами («1. Открытие списка»),
 * вложенные (из методов экранов) — нет. `box: true` — ошибка указывает на строку теста,
 * а не на глубину класса экрана. В Allure шаги видны с теми же номерами.
 */
export function step<T>(title: string, body: () => Promise<T>): Promise<T> {
	let name = title;
	if (!insideStep.getStore()) {
		const info = test.info();
		const number = (stepNumbers.get(info) ?? 0) + 1;
		stepNumbers.set(info, number);
		name = `${number}. ${title}`;
	}
	return test.step(name, () => insideStep.run(true, body), { box: true });
}
