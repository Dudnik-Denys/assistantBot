import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * tailwind-merge по умолчанию знает только стандартную шкалу Tailwind.
 * Наши токены из app.css (`--spacing-page-*`, `--spacing-safe-*`) регистрируем, чтобы
 * `pb-3` и `pb-page-b` считались конфликтующими, а не двумя разными классами.
 * Цвета (`bg-tg-*`, `text-tg-*`) tailwind-merge распознаёт сам.
 */
const twMerge = extendTailwindMerge({
	extend: {
		theme: {
			spacing: [
				'page-t',
				'page-b',
				'page-l',
				'page-r',
				'safe-top',
				'safe-bottom',
				'safe-left',
				'safe-right',
			],
		},
	},
});

/**
 * Склеивает классы (строки, массивы, объекты условий — как `class={[…]}` в Svelte)
 * и убирает конфликтующие: побеждает класс, переданный позже.
 * Для компонентов, принимающих `class` снаружи: `class={mergeClasses('px-4 pb-3', className)}`.
 */
export function mergeClasses(...inputs: ClassValue[]): string {
	return twMerge(clsx(inputs));
}
