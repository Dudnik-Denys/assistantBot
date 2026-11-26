import { Temporal } from 'temporal-polyfill';

/**
 * Temporal — даты без времени, время без даты и дата-время без часового пояса. В Safari (а значит
 * во всех браузерах iOS и WebView Telegram) встроенного `Temporal` пока нет, поэтому — полифил
 * `temporal-polyfill` без подмены глобального объекта. Когда Safari его выпустит, заменить
 * импорт нужно только здесь: остальной код берёт `Temporal` из этого модуля.
 */
export { Temporal };

/** Значение поля `type="date"` (`2026-11-24`) → дата; пустое или неверное — null. */
export function parsePlainDate(value: string): Temporal.PlainDate | null {
	try {
		return value ? Temporal.PlainDate.from(value) : null;
	} catch {
		return null;
	}
}

/** Значение поля `type="time"` (`12:00`) → время; пустое или неверное — null. */
export function parsePlainTime(value: string): Temporal.PlainTime | null {
	try {
		return value ? Temporal.PlainTime.from(value) : null;
	} catch {
		return null;
	}
}

/** Время для поля `type="time"` и API — с точностью до минуты: `12:00`. */
export function formatPlainTime(time: Temporal.PlainTime): string {
	return time.toString({ smallestUnit: 'minute' });
}

/** Дата и время вместе, с точностью до минуты: `2026-11-24T12:00` — так их принимает API. */
export function formatPlainDateTime(dateTime: Temporal.PlainDateTime): string {
	return dateTime.toString({ smallestUnit: 'minute' });
}

/** Момент (ISO-строка из API, UTC) → дата и время на циферблате в поясе `timeZone`. */
export function toPlainDateTime(iso: string, timeZone: string): Temporal.PlainDateTime {
	return Temporal.Instant.from(iso).toZonedDateTimeISO(timeZone).toPlainDateTime();
}
