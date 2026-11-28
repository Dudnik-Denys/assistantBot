import { z } from 'zod';
import type { HttpClient } from '#lib/http/client.ts';

export interface ResourceOptions {
	/**
	 * Список отсортирован по времени создания (`createdAt desc`), а не изменения: изменённый
	 * элемент остаётся в кеше на своём месте, а не переезжает в начало.
	 */
	stableOrder?: boolean;
}

/**
 * Коллекция API, которую клиент читает и удаляет, но не создаёт и не изменяет (записи создаёт
 * сервер — например, уведомления от воркера): `GET /path?q=` — список, `GET /path/:id` —
 * элемент, `DELETE /path/:id` — удаление. Полный набор с созданием и изменением — `RestResource`.
 *
 * Хранит в памяти последний общий список (без поиска) — `cachedList`: экран списка показывает его
 * сразу при возвращении и обновляет в фоне. Изменения сразу правят кеш, чтобы после них не мелькал
 * устаревший список. Кеш живёт, пока открыто приложение. Нестандартные действия добавляются
 * в наследнике через тот же `HttpClient`; изменённую запись они кладут в кеш через `cacheItem`.
 */
export class ReadResource<Dto extends { id: string }> {
	#cachedList: Dto[] | null = null;
	readonly #listSchema: z.ZodType<Dto[]>;

	/** schema — схема DTO из `@tgab/core/dto`: ею проверяется каждый ответ. */
	constructor(
		protected readonly http: HttpClient,
		protected readonly path: string,
		protected readonly schema: z.ZodType<Dto>,
		private readonly options: ResourceOptions = {},
	) {
		this.#listSchema = z.array(schema);
	}

	/** Последний загруженный общий список; null — ещё не загружался. */
	get cachedList(): Dto[] | null {
		return this.#cachedList;
	}

	/** Список; searchQuery — поисковый запрос, signal — отмена устаревшего запроса. */
	async list(searchQuery = '', signal?: AbortSignal): Promise<Dto[]> {
		const queryString = searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : '';
		const items = await this.http.request(`${this.path}${queryString}`, {
			signal,
			schema: this.#listSchema,
		});
		if (!searchQuery) this.#cachedList = items;
		return items;
	}

	/** Элемент по id; fetchFn — `fetch` из `load`. */
	get(id: string, fetchFn?: typeof fetch): Promise<Dto> {
		return this.http.request(`${this.path}/${id}`, { fetchFn, schema: this.schema });
	}

	async remove(id: string): Promise<void> {
		await this.http.request(`${this.path}/${id}`, { method: 'DELETE' });
		if (this.#cachedList) this.#cachedList = this.#cachedList.filter((item) => item.id !== id);
	}

	/** Действие над записью (`POST <раздел>/<id>/<действие>`): ответ — изменённый DTO, он же в кеш. */
	protected async recordAction(id: string, action: string): Promise<Dto> {
		const item = await this.http.request(`${this.path}/${id}/${action}`, {
			method: 'POST',
			schema: this.schema,
		});
		this.cacheItem(item);
		return item;
	}

	/**
	 * Изменённый элемент — в кеш: в начало, если список отсортирован по времени изменения,
	 * иначе (`stableOrder`) — на прежнее место.
	 */
	protected cacheItem(item: Dto): void {
		if (!this.#cachedList) return;
		if (this.options.stableOrder) {
			this.#cachedList = this.#cachedList.map((cached) => (cached.id === item.id ? item : cached));
		} else {
			this.putFirst(item);
		}
	}

	/** Новый элемент — в начало кеша: список отсортирован от новых к старым. */
	protected putFirst(item: Dto): void {
		if (!this.#cachedList) return;
		this.#cachedList = [item, ...this.#cachedList.filter((cached) => cached.id !== item.id)];
	}
}
