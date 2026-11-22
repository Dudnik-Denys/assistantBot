import type { HttpClient } from '#lib/http/client.ts';

/**
 * Типовые операции над коллекцией API по REST-соглашению проекта:
 * `GET /path?q=` — список, `GET /path/:id` — элемент, `POST /path` — создание,
 * `PUT /path/:id` — изменение, `DELETE /path/:id` — удаление.
 *
 * Новый раздел — одна строка в `lib/api.ts`. Нестандартные действия (например, `+1` у счётчика)
 * добавляются в наследнике или обёртке рядом, через тот же `HttpClient`.
 */
export class RestResource<Dto, Input> {
	constructor(
		protected readonly http: HttpClient,
		protected readonly path: string,
	) {}

	/** Список; q — поисковый запрос, signal — отмена устаревшего запроса. */
	list(q = '', signal?: AbortSignal): Promise<Dto[]> {
		const query = q ? `?q=${encodeURIComponent(q)}` : '';
		return this.http.request<Dto[]>(`${this.path}${query}`, { signal });
	}

	/** Элемент по id; fetchFn — `fetch` из `load`. */
	get(id: string, fetchFn?: typeof fetch): Promise<Dto> {
		return this.http.request<Dto>(`${this.path}/${id}`, { fetchFn });
	}

	create(input: Input): Promise<Dto> {
		return this.http.request<Dto>(this.path, { method: 'POST', body: input });
	}

	update(id: string, input: Input): Promise<Dto> {
		return this.http.request<Dto>(`${this.path}/${id}`, { method: 'PUT', body: input });
	}

	remove(id: string): Promise<void> {
		return this.http.request<void>(`${this.path}/${id}`, { method: 'DELETE' });
	}
}
