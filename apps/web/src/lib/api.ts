import type {
	CounterDto,
	CounterInput,
	NoteDto,
	NoteInput,
	NotificationDto,
	UserDto,
} from '@tgab/core';
import { DEFAULT_TIMEZONE } from '@tgab/core/constants/users';
import { HttpClient } from '#lib/http/client.ts';
import { ReadResource } from '#lib/http/read-resource.ts';
import { RestResource } from '#lib/http/rest-resource.ts';

export { ApiError } from '#lib/http/client.ts';
export type { CounterDto, CounterInput, NoteDto, NotificationDto, UserDto };

/** Текущий (вошедший) пользователь — не коллекция, поэтому свой класс, а не RestResource. */
class UserApi {
	#current: UserDto | null = null;

	constructor(private readonly http: HttpClient) {}

	/**
	 * Последний загруженный профиль; его загружает корневой layout до показа любой страницы,
	 * поэтому на страницах приложения он уже есть. null — ещё не загружался или нет доступа.
	 */
	get current(): UserDto | null {
		return this.#current;
	}

	/** Часовой пояс пользователя (IANA) — в нём вводятся и показываются даты счётчиков. */
	get timeZone(): string {
		return this.#current?.timezone ?? DEFAULT_TIMEZONE;
	}

	/** Профиль текущего пользователя; 403 — нет в allowlist. fetchFn — `fetch` из `load`. */
	async get(fetchFn?: typeof fetch): Promise<UserDto> {
		this.#current = await this.http.request<UserDto>('/user', { fetchFn });
		return this.#current;
	}
}

/** Действие над счётчиком: `POST /counters/:id/<действие>`. */
type CounterAction = 'increment' | 'decrement' | 'reset' | 'restart';

/** Счётчики: CRUD и действия (−1, +1, сброс, «Продолжить»); результат действия — в кеш списка. */
class CountersApi extends RestResource<CounterDto, CounterInput> {
	increment(id: string): Promise<CounterDto> {
		return this.#act(id, 'increment');
	}

	decrement(id: string): Promise<CounterDto> {
		return this.#act(id, 'decrement');
	}

	reset(id: string): Promise<CounterDto> {
		return this.#act(id, 'reset');
	}

	/** Новый цикл с теми же параметрами (только у закончившегося таймера). */
	restart(id: string): Promise<CounterDto> {
		return this.#act(id, 'restart');
	}

	async #act(id: string, action: CounterAction): Promise<CounterDto> {
		const counter = await this.http.request<CounterDto>(`${this.path}/${id}/${action}`, {
			method: 'POST',
		});
		this.cacheItem(counter);
		return counter;
	}
}

/**
 * Уведомления раздела «Напоминания»: создаёт их воркер, клиент только читает, отмечает
 * прочитанными и удаляет — поэтому `ReadResource`, без `create` и `update`.
 */
class NotificationsApi extends ReadResource<NotificationDto> {
	async markRead(id: string): Promise<NotificationDto> {
		const notification = await this.http.request<NotificationDto>(`${this.path}/${id}/read`, {
			method: 'POST',
		});
		this.cacheItem(notification);
		return notification;
	}
}

const http = new HttpClient('/api');

/** API Mini App. Новый раздел: `<раздел>: new RestResource<Dto, Input>(http, '/<раздел>')`. */
export const api = {
	user: new UserApi(http),
	notes: new RestResource<NoteDto, NoteInput>(http, '/notes'),
	counters: new CountersApi(http, '/counters', { stableOrder: true }),
	notifications: new NotificationsApi(http, '/notifications', { stableOrder: true }),
};
