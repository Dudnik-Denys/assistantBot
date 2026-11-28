import type {
	CounterDto,
	CounterInput,
	NoteDto,
	NoteInput,
	NotificationDto,
	UserDto,
} from '@tgab/core';
import { DEFAULT_TIMEZONE } from '@tgab/core/constants/users';
import {
	CounterDtoSchema,
	NoteDtoSchema,
	NotificationDtoSchema,
	UserDtoSchema,
} from '@tgab/core/dto';
import { z } from 'zod';
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
		this.#current = await this.http.request('/user', { fetchFn, schema: UserDtoSchema });
		return this.#current;
	}
}

/** Счётчики: CRUD и действия (−1, +1, сброс, «Стоп», «Старт»); результат действия — в кеш списка. */
class CountersApi extends RestResource<CounterDto, CounterInput> {
	increment(id: string): Promise<CounterDto> {
		return this.recordAction(id, 'increment');
	}

	decrement(id: string): Promise<CounterDto> {
		return this.recordAction(id, 'decrement');
	}

	/** Число — к начальному, таймер — новый цикл на паузе. */
	reset(id: string): Promise<CounterDto> {
		return this.recordAction(id, 'reset');
	}

	/** «Стоп»: таймер на паузу. */
	pause(id: string): Promise<CounterDto> {
		return this.recordAction(id, 'pause');
	}

	/** «Старт»: продолжить после паузы или новый цикл с теми же параметрами после окончания. */
	start(id: string): Promise<CounterDto> {
		return this.recordAction(id, 'start');
	}

	/** Завершить наступивший цикл сразу, не дожидаясь воркера; не наступил — без изменений. */
	finish(id: string): Promise<CounterDto> {
		return this.recordAction(id, 'finish');
	}

	/** То же для всех наступивших циклов; ответ — изменённые счётчики (они же — в кеш). */
	async finishDue(): Promise<CounterDto[]> {
		const counters = await this.http.request(`${this.path}/finish-due`, {
			method: 'POST',
			schema: z.array(this.schema),
		});
		for (const counter of counters) this.cacheItem(counter);
		return counters;
	}
}

/**
 * Уведомления раздела «Напоминания»: создаёт их воркер, клиент только читает, отмечает
 * прочитанными и удаляет — поэтому `ReadResource`, без `create` и `update`.
 */
class NotificationsApi extends ReadResource<NotificationDto> {
	markRead(id: string): Promise<NotificationDto> {
		return this.recordAction(id, 'read');
	}
}

const http = new HttpClient('/api');

/**
 * API Mini App. Новый раздел: `<раздел>: new RestResource<Dto, Input>(http, '/<раздел>', XDtoSchema)`
 * — схема DTO из `@tgab/core/dto` проверяет каждый ответ.
 */
export const api = {
	user: new UserApi(http),
	notes: new RestResource<NoteDto, NoteInput>(http, '/notes', NoteDtoSchema),
	counters: new CountersApi(http, '/counters', CounterDtoSchema, { stableOrder: true }),
	notifications: new NotificationsApi(http, '/notifications', NotificationDtoSchema, {
		stableOrder: true,
	}),
};
