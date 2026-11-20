import type { NoteDto, NoteInput } from '@tgab/core';
import { webApp } from './telegram.ts';

export type { NoteDto };

export interface Me {
	id: string;
	telegramId: string;
	firstName: string | null;
	isAdmin: boolean;
	timezone: string;
}

export class ApiError extends Error {
	constructor(
		readonly status: number,
		message: string,
		readonly body: Record<string, unknown> = {}
	) {
		super(message);
	}
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
	const headers = new Headers(init.headers);
	const initData = webApp()?.initData;
	if (initData) headers.set('Authorization', `tma ${initData}`);
	if (init.body) headers.set('Content-Type', 'application/json');

	const res = await fetch(path, { ...init, headers });
	if (res.status === 204) return undefined as T;
	const body = await res.json().catch(() => ({}));
	if (!res.ok) throw new ApiError(res.status, body.error ?? `Ошибка ${res.status}`, body);
	return body as T;
}

export const api = {
	me: () => request<Me>('/api/me'),
	notes: {
		list: (q = '', signal?: AbortSignal) =>
			request<NoteDto[]>(`/api/notes${q ? `?q=${encodeURIComponent(q)}` : ''}`, { signal }),
		get: (id: string) => request<NoteDto>(`/api/notes/${id}`),
		create: (input: NoteInput) =>
			request<NoteDto>('/api/notes', { method: 'POST', body: JSON.stringify(input) }),
		update: (id: string, input: NoteInput) =>
			request<NoteDto>(`/api/notes/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
		remove: (id: string) => request<void>(`/api/notes/${id}`, { method: 'DELETE' })
	}
};
