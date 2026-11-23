import { describe, expect, test } from 'bun:test';
import { formatShortDate } from '#web/lib/utils/dates.ts';

// Даты — в местном времени: функция сравнивает дни по часовому поясу устройства.
const NOW = new Date(2026, 4, 20, 18, 30);
const TODAY = new Date(2026, 4, 20, 9, 5).toISOString();
const THIS_YEAR = new Date(2026, 0, 3, 12, 0).toISOString();
const LAST_YEAR = new Date(2025, 4, 3, 12, 0).toISOString();

describe('formatShortDate', () => {
	test('Только время для сегодняшней даты', () => {
		expect(formatShortDate(TODAY, NOW)).toBe('09:05');
	});

	test('День и месяц без года для даты этого года', () => {
		const formatted = formatShortDate(THIS_YEAR, NOW);
		expect(formatted).toContain('3');
		expect(formatted).toContain('янв');
		expect(formatted).not.toContain('2026');
	});

	test('Полная дата с годом для прошлых лет', () => {
		const formatted = formatShortDate(LAST_YEAR, NOW);
		expect(formatted).toContain('мая');
		expect(formatted).toContain('2025');
	});
});
