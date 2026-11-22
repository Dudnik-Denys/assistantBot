import { createNotesService, createUsersService, type NoteDto, type NoteInput } from '@tgab/core';
import type { PrismaClient, User } from '@tgab/db';

/** Фабрики тестовых записей: создают данные через сервисы core — тем же путём, что и приложение. */

let nextTelegramId = 1_000_000n;

/** Пользователь из allowlist с уникальным telegramId. */
export function createTestUser(db: PrismaClient, { isAdmin = false } = {}): Promise<User> {
	nextTelegramId += 1n;
	return createUsersService(db).allow(nextTelegramId, { isAdmin });
}

export function createTestNote(
	db: PrismaClient,
	userId: string,
	input: NoteInput = { title: 'Заметка' },
): Promise<NoteDto> {
	return createNotesService(db).create(userId, input);
}
