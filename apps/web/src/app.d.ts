// See https://svelte.dev/docs/kit/types#app.d.ts
import type { User } from '@tgab/db';

declare global {
	namespace App {
		interface Locals {
			user: User | null;
		}
	}
}
