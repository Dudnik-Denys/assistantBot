import {
	MS_PER_SECOND,
	SECONDS_PER_DAY,
	SECONDS_PER_HOUR,
	SECONDS_PER_MINUTE,
} from '@tgab/core/constants/time';

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

/** Дата и время в часовом поясе пользователя: «24 нояб. 2026 г., 12:00». */
export function formatDateTime(iso: string, timeZone: string): string {
	return new Intl.DateTimeFormat('ru', {
		timeZone,
		day: 'numeric',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	}).format(new Date(iso));
}

/** Оставшееся время для обратного отсчёта: «3 д 04:05:06», меньше суток — «04:05:06». */
export function formatRemaining(ms: number): string {
	const total = Math.max(0, Math.ceil(ms / MS_PER_SECOND));
	const days = Math.floor(total / SECONDS_PER_DAY);
	const hours = Math.floor((total % SECONDS_PER_DAY) / SECONDS_PER_HOUR);
	const minutes = Math.floor((total % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
	const seconds = total % SECONDS_PER_MINUTE;
	const clock = [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
	return days > 0 ? `${days} д ${clock}` : clock;
}

/** Доля прошедшего времени цикла от 0 до 1 (для кругового прогресса). */
export function cycleProgress(startAt: string, targetAt: string, now: number): number {
	const start = new Date(startAt).getTime();
	const length = new Date(targetAt).getTime() - start;
	if (length <= 0) return 1;
	return Math.min(1, Math.max(0, (now - start) / length));
}
