// В apps/web/src/lib/api.ts:
// 1) добавить __Entity__Dto и __Entity__Input в `import type { … } from '@tgab/core'`,
//    __Entity__Dto — в `export type { … }`, а __Entity__DtoSchema — в `import { … } from
//    '@tgab/core/dto'` (схема проверяет каждый ответ);
// 2) добавить строку в объект `api` (RestResource сам кеширует общий список и правит кеш
//    при create/update/remove; DTO обязан иметь `id: string`). Порядок списка не должен
//    меняться от правок (сортировка по `createdAt`) — `{ stableOrder: true }`: изменённая
//    запись остаётся на своём месте в кеше, а не поднимается наверх:

	__entities__: new RestResource<__Entity__Dto, __Entity__Input>(http, '/__entities__', __Entity__DtoSchema),

// Нестандартные действия (например, `+1` у счётчика) — класс-наследник рядом в api.ts.
// Ответ действия — изменённая запись: её надо положить в кеш списка (`cacheItem`), иначе
// при возврате к списку он покажет старое значение. Образец — `CountersApi`:
//
//   type __Entity__Action = 'increment' | 'decrement';
//
//   class __Entities__Api extends RestResource<__Entity__Dto, __Entity__Input> {
//   	increment(id: string): Promise<__Entity__Dto> {
//   		return this.#act(id, 'increment');
//   	}
//
//   	async #act(id: string, action: __Entity__Action): Promise<__Entity__Dto> {
//   		const item = await this.http.request(`${this.path}/${id}/${action}`, {
//   			method: 'POST',
//   			schema: this.schema,
//   		});
//   		this.cacheItem(item);
//   		return item;
//   	}
//   }
//
//   __entities__: new __Entities__Api(http, '/__entities__', __Entity__DtoSchema, { stableOrder: true }),
