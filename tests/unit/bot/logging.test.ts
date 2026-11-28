import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test';
import type { ApiCallFn, RawApi } from 'grammy';
import { logApiCalls, logUpdates } from '#bot/middlewares/logging.ts';
import { FAKE_USER_ID } from '../../constants/bot.ts';
import { createFakeBot } from '../../helpers/fake-bot.ts';

const SECRET = 'пароль от почты 12345';

let logSpy: ReturnType<typeof spyOn>;

beforeEach(() => {
	// Лог перехватывается и не засоряет вывод тестов.
	logSpy = spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
	logSpy.mockRestore();
});

function logged(): string {
	return logSpy.mock.calls.map((args: unknown[]) => args.join(' ')).join('\n');
}

describe('logUpdates', () => {
	test('Тест лога команды и отправителя без остального текста', async () => {
		await createFakeBot(logUpdates).send(`/start ${SECRET}`);
		expect(logged()).toContain(`from ${FAKE_USER_ID}: message /start`);
		expect(logged()).not.toContain(SECRET);
	});

	test('Тест отсутствия текста обычного сообщения в логе', async () => {
		await createFakeBot(logUpdates).send(SECRET);
		expect(logged()).toContain('message');
		expect(logged()).not.toContain(SECRET);
	});
});

describe('logApiCalls', () => {
	// Предыдущий вызов в цепочке трансформеров: успешный ответ без сети.
	const okCall = (async () => ({ ok: true, result: true })) as unknown as ApiCallFn<RawApi>;

	test('Тест лога метода и результата вызова Bot API', async () => {
		await logApiCalls(okCall, 'sendMessage', { chat_id: 1, text: SECRET });
		expect(logged()).toContain('→ sendMessage ok');
		expect(logged()).not.toContain(SECRET);
	});

	test('Тест отсутствия getUpdates в логе', async () => {
		await logApiCalls(okCall, 'getUpdates', {});
		expect(logSpy).not.toHaveBeenCalled();
	});
});
