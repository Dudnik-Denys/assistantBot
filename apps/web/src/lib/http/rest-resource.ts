import { ReadResource } from '#lib/http/read-resource.ts';

/**
 * Коллекция API с полным набором операций по REST-соглашению проекта: к чтению и удалению
 * (`ReadResource`) добавляются `POST /path` — создание и `PUT /path/:id` — изменение;
 * оба сразу правят кеш списка.
 *
 * Новый раздел — одна строка в `lib/api.ts`. Нестандартные действия (например, `+1` у счётчика)
 * добавляются в наследнике рядом, через тот же `HttpClient`; изменённую запись они кладут
 * в кеш через `cacheItem`.
 */
export class RestResource<Dto extends { id: string }, Input> extends ReadResource<Dto> {
	async create(input: Input): Promise<Dto> {
		const created = await this.http.request(this.path, {
			method: 'POST',
			body: input,
			schema: this.schema,
		});
		this.putFirst(created);
		return created;
	}

	async update(id: string, input: Input): Promise<Dto> {
		const updated = await this.http.request(`${this.path}/${id}`, {
			method: 'PUT',
			body: input,
			schema: this.schema,
		});
		this.cacheItem(updated);
		return updated;
	}
}
