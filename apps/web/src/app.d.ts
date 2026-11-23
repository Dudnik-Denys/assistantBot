// See https://svelte.dev/docs/kit/types#app.d.ts
import type { User } from '@tgab/db';

declare global {
	namespace App {
		/** Ошибка для routes/+error.svelte: `title` — заголовок вместо общего, `message` — текст под ним. */
		interface Error {
			message: string;
			title?: string;
		}

		interface Locals {
			user: User | null;
		}
	}
}
