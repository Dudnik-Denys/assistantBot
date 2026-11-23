import { errorMessage } from '#lib/errors.ts';

/**
 * Пауза после последнего изменения перед сохранением: для пользователя это «сразу»,
 * но запрос уходит не на каждую букву.
 */
const AUTOSAVE_DELAY_MS = 300;

export interface AutosaveOptions<T> {
	/** Текущие данные; читается реактивно — изменение запускает отложенное сохранение. */
	value: () => T;
	/** Можно ли сохранить эти данные (например, заполнено обязательное поле). */
	canSave: (value: T) => boolean;
	save: (value: T) => Promise<void>;
	delayMs?: number;
}

/**
 * Автосохранение формы (как в Заметках iOS — без кнопки и без индикатора «Сохранение…»):
 * сохраняет данные через короткую паузу после изменения, а также сразу —
 * при сворачивании приложения и уничтожении компонента. Сохранения идут строго по очереди,
 * поэтому `save` может опираться на результат предыдущего (id созданной записи).
 * Начальные данные считаются сохранёнными.
 *
 * Создавать при инициализации компонента (в <script>): эффекты живут, пока жив компонент.
 *
 *   const autosave = new Autosave({ value: () => ({ title, content }), canSave, save });
 *   await autosave.flush(); // перед уходом со страницы
 */
export class Autosave<T> {
	#value: () => T;
	#canSave: (value: T) => boolean;
	#save: (value: T) => Promise<void>;
	#savedKey = $state('');
	#error = $state<string | null>(null);
	#queue: Promise<void> = Promise.resolve();
	#cancelPending: (() => void) | undefined;

	constructor({ value, canSave, save, delayMs = AUTOSAVE_DELAY_MS }: AutosaveOptions<T>) {
		this.#value = value;
		this.#canSave = canSave;
		this.#save = save;
		this.#savedKey = JSON.stringify(value());

		$effect(() => {
			const current = value();
			const key = JSON.stringify(current);
			// Вернули сохранённое — прошлая ошибка уже не про эти данные.
			if (key === this.#savedKey) this.#error = null;
			if (key === this.#savedKey || !canSave(current)) return;
			const timer = setTimeout(() => this.#enqueue(current, key), delayMs);
			this.#cancelPending = () => clearTimeout(timer);
			return () => clearTimeout(timer);
		});

		// Свернули приложение или ушли со страницы — сохранить, не дожидаясь паузы.
		$effect(() => {
			const onVisibilityChange = () => {
				if (document.visibilityState === 'hidden') void this.flush();
			};
			document.addEventListener('visibilitychange', onVisibilityChange);
			return () => {
				document.removeEventListener('visibilitychange', onVisibilityChange);
				void this.flush();
			};
		});
	}

	/** Есть изменения, которые ещё не сохранены. */
	get dirty(): boolean {
		return JSON.stringify(this.#value()) !== this.#savedKey;
	}

	/** Текст ошибки последнего сохранения или null. */
	get error(): string | null {
		return this.#error;
	}

	/** Сохранить сейчас, не дожидаясь паузы. true — все данные сохранены. */
	async flush(): Promise<boolean> {
		this.#cancelPending?.();
		const current = this.#value();
		const key = JSON.stringify(current);
		if (key === this.#savedKey) this.#error = null;
		else if (this.#canSave(current)) this.#enqueue(current, key);
		await this.#queue;
		return this.#error === null && key === this.#savedKey;
	}

	#enqueue(value: T, key: string): void {
		this.#queue = this.#queue.then(async () => {
			if (key === this.#savedKey) return;
			try {
				await this.#save(value);
				this.#savedKey = key;
				this.#error = null;
			} catch (error) {
				this.#error = errorMessage(error);
			}
		});
	}
}
