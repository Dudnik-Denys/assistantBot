import { describe, expect, test } from 'bun:test';
import {
	MS_PER_DAY,
	MS_PER_SECOND,
	SECONDS_PER_HOUR,
	SECONDS_PER_MINUTE,
} from '#core/constants/time.ts';
import {
	cycleProgress,
	formatDateTime,
	formatRemaining,
	formatShortDate,
} from '#web/lib/utils/dates.ts';

// Даты — в местном времени: функция сравнивает дни по часовому поясу устройства; его задаёт
// запускалка (`TEST_TIME_ZONE`), а не машина, на которой идут тесты.
const NOW = new Date(2026, 4, 20, 18, 30);
const TODAY = new Date(2026, 4, 20, 9, 5).toISOString();
const THIS_YEAR = new Date(2026, 0, 3, 12, 0).toISOString();
const LAST_YEAR = new Date(2025, 4, 3, 12, 0).toISOString();

describe('formatShortDate', () => {
	test('Тест показа только времени для сегодняшней даты', () => {
		expect(formatShortDate(TODAY, NOW)).toBe('09:05');
	});

	test('Тест показа дня и месяца без года для даты этого года', () => {
		const formatted = formatShortDate(THIS_YEAR, NOW);
		expect(formatted).toContain('3');
		expect(formatted).toContain('янв');
		expect(formatted).not.toContain('2026');
	});

	test('Тест показа полной даты с годом для прошлых лет', () => {
		const formatted = formatShortDate(LAST_YEAR, NOW);
		expect(formatted).toContain('мая');
		expect(formatted).toContain('2025');
	});
});

describe('formatDateTime', () => {
	test('Тест показа даты и времени в поясе пользователя, а не устройства', () => {
		const iso = '2026-11-24T10:00:00.000Z';
		expect(formatDateTime(iso, 'Europe/Kyiv')).toContain('12:00');
		expect(formatDateTime(iso, 'Asia/Tokyo')).toContain('19:00');
	});

	test('Тест смены дня по поясу пользователя', () => {
		expect(formatDateTime('2026-11-24T22:30:00.000Z', 'Europe/Kyiv')).toContain('25');
	});
});

describe('formatRemaining', () => {
	test('Тест показа часов, минут и секунд для остатка меньше суток', () => {
		expect(
			formatRemaining((4 * SECONDS_PER_HOUR + 5 * SECONDS_PER_MINUTE + 6) * MS_PER_SECOND),
		).toBe('04:05:06');
	});

	test('Тест показа дней перед временем для остатка от суток', () => {
		expect(formatRemaining(3 * MS_PER_DAY + 6 * MS_PER_SECOND)).toBe('3 д 00:00:06');
	});

	test('Тест округления неполной секунды вверх', () => {
		expect(formatRemaining(1)).toBe('00:00:01');
	});

	test('Тест подстановки нуля вместо отрицательного остатка', () => {
		expect(formatRemaining(-5 * MS_PER_SECOND)).toBe('00:00:00');
	});
});

describe('cycleProgress', () => {
	const START = '2026-11-24T10:00:00.000Z';
	const TARGET = '2026-11-24T12:00:00.000Z';
	const startMs = Date.parse(START);
	const length = Date.parse(TARGET) - startMs;

	test('Тест подсчёта доли прошедшего времени цикла', () => {
		expect(cycleProgress(START, TARGET, startMs + length / 4)).toBe(0.25);
	});

	test('Тест ограничения доли от 0 до 1 до старта и после окончания', () => {
		expect(cycleProgress(START, TARGET, startMs - length)).toBe(0);
		expect(cycleProgress(START, TARGET, startMs + 2 * length)).toBe(1);
	});

	test('Тест завершённости цикла нулевой длины', () => {
		expect(cycleProgress(START, START, startMs - 1)).toBe(1);
	});
});
