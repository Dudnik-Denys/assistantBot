import type { HttpClient } from '#lib/http/client.ts';

/**
 * Типовые операции над коллекцией API по REST-соглашению проекта:
 * `GET /path?q=` — список, `GET /path/:id` — элемент, `POST /path` — создание,
 * `PUT /path/:id` — изменение, `DELETE /path/:id` — удаление.
 *
 * Хранит в памяти последний общий список (без поиска) — `cachedList`: экран списка показывает его
 * сразу при возвращении и обновляет в фоне. Создание, изменение и удаление сразу правят кеш,
 * чтобы после них не мелькал устаревший список. Кеш живёт, пока открыто приложение.
 *
 * Новый раздел — одна строка в `lib/api.ts`. Нестандартные действия (например, `+1` у счётчика)
 * добавляются в наследнике или обёртке рядом, через тот же `HttpClient`.
 */
export class RestResource<Dto extends { id: string }, Input> {
	#cachedList: Dto[] | null = null;

	constructor(
		protected readonly http: HttpClient,
		protected readonly path: string,
	) {}

	/** Последний загруженный общий список; null — ещё не загружался. */
	get cachedList(): Dto[] | null {
		return this.#cachedList;
	}

	/** Список; searchQuery — поисковый запрос, signal — отмена устаревшего запроса. */
	async list(searchQuery = '', signal?: AbortSignal): Promise<Dto[]> {
		const queryString = searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : '';
		const items = await this.http.request<Dto[]>(`${this.path}${queryString}`, { signal });
		if (!searchQuery) this.#cachedList = items;
		return items;
	}

	/** Элемент по id; fetchFn — `fetch` из `load`. */
	get(id: string, fetchFn?: typeof fetch): Promise<Dto> {
		return this.http.request<Dto>(`${this.path}/${id}`, { fetchFn });
	}

	async create(input: Input): Promise<Dto> {
		const created = await this.http.request<Dto>(this.path, { method: 'POST', body: input });
		this.#putFirst(created);
		return created;
	}

	async update(id: string, input: Input): Promise<Dto> {
		const updated = await this.http.request<Dto>(`${this.path}/${id}`, {
			method: 'PUT',
			body: input,
		});
		this.#putFirst(updated);
		return updated;
	}

	async remove(id: string): Promise<void> {
		await this.http.request<void>(`${this.path}/${id}`, { method: 'DELETE' });
		if (this.#cachedList) this.#cachedList = this.#cachedList.filter((item) => item.id !== id);
	}

	/** Созданный или изменённый элемент — в начало кеша: список отсортирован от новых к старым. */
	#putFirst(item: Dto): void {
		if (!this.#cachedList) return;
		this.#cachedList = [item, ...this.#cachedList.filter((cached) => cached.id !== item.id)];
	}
}
