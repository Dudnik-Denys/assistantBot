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
	test('Значение поля даты — дата', () => {
		expect(parsePlainDate('2028-02-29')?.toString()).toBe('2028-02-29');
	});

	test('null для пустого и неверного значения', () => {
		for (const value of ['', 'не дата', '2026-02-30', '2026-13-01']) {
			expect(parsePlainDate(value)).toBeNull();
		}
	});
});

describe('parsePlainTime', () => {
	test('Значение поля времени — время', () => {
		expect(parsePlainTime('09:05')?.toString()).toBe('09:05:00');
	});

	test('null для пустого и неверного значения', () => {
		for (const value of ['', '25:00', '12:60', 'полдень']) expect(parsePlainTime(value)).toBeNull();
	});
});

describe('formatPlainTime', () => {
	test('Время с точностью до минуты, без секунд', () => {
		expect(formatPlainTime(Temporal.PlainTime.from('09:05:59'))).toBe('09:05');
	});
});

describe('formatPlainDateTime', () => {
	test('Дата и время в формате API, без секунд', () => {
		const dateTime = Temporal.PlainDateTime.from('2026-11-24T12:00:30');
		expect(formatPlainDateTime(dateTime)).toBe('2026-11-24T12:00');
	});
});

describe('toPlainDateTime', () => {
	test('Момент UTC — время на циферблате пояса с учётом летнего времени', () => {
		expect(toPlainDateTime('2026-01-15T10:00:00.000Z', 'Europe/Kyiv').toString()).toBe(
			'2026-01-15T12:00:00',
		);
		expect(toPlainDateTime('2026-07-15T10:00:00.000Z', 'Europe/Kyiv').toString()).toBe(
			'2026-07-15T13:00:00',
		);
	});

	test('Смена даты по поясу', () => {
		expect(toPlainDateTime('2026-11-24T22:30:00.000Z', 'Europe/Kyiv').toString()).toBe(
			'2026-11-25T00:30:00',
		);
	});
});
