import { describe, expect, test } from 'bun:test';
import { createHmac } from 'node:crypto';
import { InitDataError, validateInitData } from './init-data.ts';

const TOKEN = '123456:TEST-token';

function sign(fields: Record<string, string>, token = TOKEN): string {
	const dcs = Object.entries(fields)
		.map(([k, v]) => `${k}=${v}`)
		.sort()
		.join('\n');
	const secret = createHmac('sha256', 'WebAppData').update(token).digest();
	const hash = createHmac('sha256', secret).update(dcs).digest('hex');
	return new URLSearchParams({ ...fields, hash }).toString();
}

const now = new Date('2026-01-01T12:00:00Z');
const authDate = String(Math.floor(now.getTime() / 1000) - 60);
const user = JSON.stringify({ id: 42, first_name: 'Тест', username: 'test' });

describe('validateInitData', () => {
	test('принимает корректную подпись', () => {
		const res = validateInitData(sign({ auth_date: authDate, user, query_id: 'abc' }), TOKEN, {
			now,
		});
		expect(res.user.id).toBe(42);
		expect(res.user.username).toBe('test');
	});

	test('отклоняет чужой токен', () => {
		const data = sign({ auth_date: authDate, user }, 'other:token');
		expect(() => validateInitData(data, TOKEN, { now })).toThrow(InitDataError);
	});

	test('отклоняет подменённые данные', () => {
		const data = sign({ auth_date: authDate, user }).replace('42', '43');
		expect(() => validateInitData(data, TOKEN, { now })).toThrow(InitDataError);
	});

	test('отклоняет устаревшие данные', () => {
		const old = String(Math.floor(now.getTime() / 1000) - 2 * 24 * 3600);
		expect(() => validateInitData(sign({ auth_date: old, user }), TOKEN, { now })).toThrow(
			'устарели',
		);
	});
});
