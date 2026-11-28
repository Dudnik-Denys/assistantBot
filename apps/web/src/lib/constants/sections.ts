/**
 * Разделы главного меню. Новая функция — новый пункт здесь и маршрут в routes/.
 * `route` — идентификатор маршрута: адрес строит `resolve(section.route)` там, где пункт
 * рисуется (`routes/+page.svelte`), поэтому файл без `$app/*` — его импортируют и e2e-тесты
 * (`#web/lib/constants/sections.ts`), чтобы не повторять названия разделов.
 */
export const Section = {
	Notes: { route: '/notes', title: 'Заметки', description: 'Текст и ссылки, поиск', icon: '📝' },
	Counters: {
		route: '/counters',
		title: 'Счётчики',
		description: 'Ручной счёт и таймеры на срок или до даты',
		icon: '⏱',
	},
	Reminders: {
		route: '/reminders',
		title: 'Напоминания',
		description: 'Уведомления об окончании циклов счётчиков',
		icon: '🔔',
	},
} as const;

/** Пункты меню в порядке показа. */
export const SECTIONS = [Section.Notes, Section.Counters, Section.Reminders] as const;
