import { describe, expect, test } from 'bun:test';
import {
	formatPlainDateTime,
	formatPlainTime,
	parsePlainDate,
	parsePlainTime,
	Temporal,
	toPlainDateTime,
} from '#web/lib/utils/temporal.ts';

describe('parsePlainDate', () => {
	test('Тест разбора значения поля даты в дату', () => {
		expect(parsePlainDate('2028-02-29')?.toString()).toBe('2028-02-29');
	});

	test('Тест возврата null для пустого и неверного значения', () => {
		for (const value of ['', 'не дата', '2026-02-30', '2026-13-01']) {
			expect(parsePlainDate(value)).toBeNull();
		}
	});
});

describe('parsePlainTime', () => {
	test('Тест разбора значения поля времени во время', () => {
		expect(parsePlainTime('09:05')?.toString()).toBe('09:05:00');
	});

	test('Тест возврата null для пустого и неверного значения', () => {
		for (const value of ['', '25:00', '12:60', 'полдень']) expect(parsePlainTime(value)).toBeNull();
	});
});

describe('formatPlainTime', () => {
	test('Тест форматирования времени с точностью до минуты, без секунд', () => {
		expect(formatPlainTime(Temporal.PlainTime.from('09:05:59'))).toBe('09:05');
	});
});

describe('formatPlainDateTime', () => {
	test('Тест форматирования даты и времени для API, без секунд', () => {
		const dateTime = Temporal.PlainDateTime.from('2026-11-24T12:00:30');
		expect(formatPlainDateTime(dateTime)).toBe('2026-11-24T12:00');
	});
});

describe('toPlainDateTime', () => {
	test('Тест перевода момента UTC во время на циферблате пояса с учётом летнего времени', () => {
		expect(toPlainDateTime('2026-01-15T10:00:00.000Z', 'Europe/Kyiv').toString()).toBe(
			'2026-01-15T12:00:00',
		);
		expect(toPlainDateTime('2026-07-15T10:00:00.000Z', 'Europe/Kyiv').toString()).toBe(
			'2026-07-15T13:00:00',
		);
	});

	test('Тест смены даты по поясу', () => {
		expect(toPlainDateTime('2026-11-24T22:30:00.000Z', 'Europe/Kyiv').toString()).toBe(
			'2026-11-25T00:30:00',
		);
	});
});
