import { resolve } from '$app/paths';

/** Разделы главного меню. Новая функция — новый пункт здесь и маршрут в routes/. */
export interface Section {
	href: string;
	title: string;
	description: string;
	icon: string;
}

export const sections: Section[] = [
	{ href: resolve('/notes'), title: 'Заметки', description: 'Текст и ссылки, поиск', icon: '📝' },
];
