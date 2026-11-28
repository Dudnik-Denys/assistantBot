import {
	createCountersService,
	createNotesService,
	createNotificationsService,
	createUsersService,
} from '@tgab/core';
import { createPrismaClient } from '@tgab/db';
import { ADMIN_TELEGRAM_ID, DATABASE_URL } from '$app/env/private';

const db = createPrismaClient(DATABASE_URL);

export const users = createUsersService(db, { adminTelegramId: ADMIN_TELEGRAM_ID });
export const notes = createNotesService(db);
export const counters = createCountersService(db);
export const notifications = createNotificationsService(db);
