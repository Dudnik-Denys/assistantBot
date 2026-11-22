import type { NoteDto, NoteInput, UserDto } from '@tgab/core';
import { HttpClient } from '#lib/http/client.ts';
import { RestResource } from '#lib/http/rest-resource.ts';

export { ApiError } from '#lib/http/client.ts';
export type { NoteDto, UserDto };

/** Текущий (вошедший) пользователь — не коллекция, поэтому свой класс, а не RestResource. */
class UserApi {
	constructor(private readonly http: HttpClient) {}

	/** Профиль текущего пользователя; 403 — нет в allowlist. fetchFn — `fetch` из `load`. */
	get(fetchFn?: typeof fetch): Promise<UserDto> {
		return this.http.request<UserDto>('/user', { fetchFn });
	}
}

const http = new HttpClient('/api');

/** API Mini App. Новый раздел: `<раздел>: new RestResource<Dto, Input>(http, '/<раздел>')`. */
export const api = {
	user: new UserApi(http),
	notes: new RestResource<NoteDto, NoteInput>(http, '/notes'),
};
