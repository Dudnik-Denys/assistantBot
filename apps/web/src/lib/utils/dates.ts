const time = new Intl.DateTimeFormat('ru', { hour: '2-digit', minute: '2-digit' });
const dayMonth = new Intl.DateTimeFormat('ru', { day: 'numeric', month: 'short' });
const full = new Intl.DateTimeFormat('ru', { day: 'numeric', month: 'short', year: 'numeric' });

/**
 * Короткая дата для списков и подписей: сегодня — время («14:05»),
 * в этом году — день и месяц («3 мая»), иначе — полная дата («3 мая 2025 г.»).
 * iso — строка даты в формате ISO (как в DTO из API); now — для тестов.
 */
export function formatShortDate(iso: string, now = new Date()): string {
	const date = new Date(iso);
	if (date.toDateString() === now.toDateString()) return time.format(date);
	if (date.getFullYear() === now.getFullYear()) return dayMonth.format(date);
	return full.format(date);
}
