// В apps/web/src/lib/api.ts:
// 1) добавить __Entity__Dto и __Entity__Input в `import type { … } from '@tgab/core'`
//    и __Entity__Dto — в `export type { … }`;
// 2) добавить строку в объект `api`:

	__entities__: new RestResource<__Entity__Dto, __Entity__Input>(http, '/__entities__'),

// Нестандартные действия (например, `+1` у счётчика) — класс-наследник рядом в api.ts:
//
//   class __Entities__Api extends RestResource<__Entity__Dto, __Entity__Input> {
//   	increment(id: string): Promise<__Entity__Dto> {
//   		return this.http.request<__Entity__Dto>(`${this.path}/${id}/increment`, { method: 'POST' });
//   	}
//   }
//
//   __entities__: new __Entities__Api(http, '/__entities__'),
