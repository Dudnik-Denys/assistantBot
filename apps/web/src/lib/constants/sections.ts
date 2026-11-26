import type { Section } from '#lib/types/sections.ts';
import { resolve } from '$app/paths';

/** Разделы главного меню. Новая функция — новый пункт здесь и маршрут в routes/. */
export const sections: Section[] = [
	{ href: resolve('/notes'), title: 'Заметки', description: 'Текст и ссылки, поиск', icon: '📝' },
	{
		href: resolve('/counters'),
		title: 'Счётчики',
		description: 'Ручной счёт и таймеры на срок или до даты',
		icon: '⏱',
	},
	{
		href: resolve('/reminders'),
		title: 'Напоминания',
		description: 'Уведомления об окончании циклов счётчиков',
		icon: '🔔',
	},
];
