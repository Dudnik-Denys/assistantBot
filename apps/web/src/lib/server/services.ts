import { createNotesService, createUsersService } from '@tgab/core';
import { createPrismaClient } from '@tgab/db';
import { ADMIN_TELEGRAM_ID, DATABASE_URL } from '$app/env/private';

export const db = createPrismaClient(DATABASE_URL);

export const users = createUsersService(db, { adminTelegramId: ADMIN_TELEGRAM_ID });
export const notes = createNotesService(db);
