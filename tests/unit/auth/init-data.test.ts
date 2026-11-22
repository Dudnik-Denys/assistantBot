import { describe, expect, test } from 'bun:test';
import { createHmac } from 'node:crypto';
import { validateInitData } from '#core/auth/init-data.ts';
import { INIT_DATA_MAX_AGE_SECONDS } from '#core/constants/auth.ts';
import { InitDataError } from '#core/errors.ts';

const BOT_TOKEN = '123456:TEST-token';
const OTHER_BOT_TOKEN = '654321:OTHER-token';
const TEST_USER_ID = 42;
const NOW = new Date('2026-01-01T12:00:00Z');
const NOW_SECONDS = Math.floor(NOW.getTime() / 1000);
/** initData, подписанные минуту назад: заведомо в пределах срока. */
const FRESH_AUTH_DATE = String(NOW_SECONDS - 60);
const USER_JSON = JSON.stringify({ id: TEST_USER_ID, first_name: 'Тест', username: 'test' });

/**
 * Подпись initData по алгоритму Telegram — написана в тесте независимо от проверяемого кода:
 * если ошибка в алгоритме, тест её заметит, а не повторит.
 */
function sign(fields: Record<string, string>, token = BOT_TOKEN): string {
	const dataCheckString = Object.entries(fields)
		.map(([key, value]) => `${key}=${value}`)
		.sort()
		.join('\n');
	const secret = createHmac('sha256', 'WebAppData').update(token).digest();
	const hash = createHmac('sha256', secret).update(dataCheckString).digest('hex');
	return new URLSearchParams({ ...fields, hash }).toString();
}

function validate(initData: string) {
	return validateInitData(initData, BOT_TOKEN, { now: NOW });
}

/** Отказ именно в той проверке, которую тест имеет в виду: класс ошибки и её текст. */
function expectRejected(initData: string, message: string) {
	expect(() => validate(initData)).toThrow(InitDataError);
	expect(() => validate(initData)).toThrow(message);
}

describe('validateInitData', () => {
	test('Принятие корректной подписи и возврат пользователя и времени входа', () => {
		const result = validate(sign({ auth_date: FRESH_AUTH_DATE, user: USER_JSON, query_id: 'abc' }));
		expect(result.user).toEqual({ id: TEST_USER_ID, first_name: 'Тест', username: 'test' });
		expect(result.authDate).toEqual(new Date(Number(FRESH_AUTH_DATE) * 1000));
	});

	test('Отбрасывание полей пользователя, которых нет в схеме', () => {
		const user = JSON.stringify({ id: TEST_USER_ID, is_premium: true });
		const result = validate(sign({ auth_date: FRESH_AUTH_DATE, user }));
		expect(result.user).toEqual({ id: TEST_USER_ID });
	});

	test('Отклонение подписи чужим токеном', () => {
		const initData = sign({ auth_date: FRESH_AUTH_DATE, user: USER_JSON }, OTHER_BOT_TOKEN);
		expectRejected(initData, 'Неверная подпись initData');
	});

	test('Отклонение данных, подменённых после подписи', () => {
		const params = new URLSearchParams(sign({ auth_date: FRESH_AUTH_DATE, user: USER_JSON }));
		params.set('user', JSON.stringify({ id: TEST_USER_ID + 1 }));
		expectRejected(params.toString(), 'Неверная подпись initData');
	});

	test('Отклонение initData без hash', () => {
		const initData = new URLSearchParams({ auth_date: FRESH_AUTH_DATE, user: USER_JSON });
		expectRejected(initData.toString(), 'В initData нет hash');
	});

	test('Принятие initData ровно на границе срока', () => {
		const authDate = String(NOW_SECONDS - INIT_DATA_MAX_AGE_SECONDS);
		expect(validate(sign({ auth_date: authDate, user: USER_JSON })).user.id).toBe(TEST_USER_ID);
	});

	test('Отклонение initData старше срока на секунду', () => {
		const authDate = String(NOW_SECONDS - INIT_DATA_MAX_AGE_SECONDS - 1);
		expectRejected(sign({ auth_date: authDate, user: USER_JSON }), 'initData устарели');
	});

	test('Отклонение некорректного auth_date', () => {
		expectRejected(sign({ auth_date: 'вчера', user: USER_JSON }), 'Некорректный auth_date');
	});

	test('Отклонение initData без user', () => {
		expectRejected(sign({ auth_date: FRESH_AUTH_DATE }), 'В initData нет user');
	});

	test('Отклонение user с некорректным JSON', () => {
		expectRejected(
			sign({ auth_date: FRESH_AUTH_DATE, user: '{не json' }),
			'Некорректный user в initData',
		);
	});

	test('Отклонение user не той формы', () => {
		const user = JSON.stringify({ id: -1 });
		expectRejected(sign({ auth_date: FRESH_AUTH_DATE, user }), 'Некорректный user в initData');
	});
});
