import { describe, expect, test } from 'bun:test';
import { z } from 'zod';
import { parseEnv } from '#core/env/parse.ts';

const TITLE = 'Некорректные переменные окружения:';
const EnvSchema = z.object({ TOKEN: z.string().min(1), PORT: z.coerce.number().int() });

describe('parseEnv', () => {
	test('Возврат разобранных значений для корректного окружения', () => {
		expect(parseEnv(EnvSchema, TITLE, { TOKEN: 'secret', PORT: '8080' })).toEqual({
			TOKEN: 'secret',
			PORT: 8080,
		});
	});

	test('Выброс ошибки с заголовком и всеми проблемами сразу', () => {
		const parse = () => parseEnv(EnvSchema, TITLE, { PORT: 'не число' });
		expect(parse).toThrow(TITLE);
		expect(parse).toThrow('TOKEN');
		expect(parse).toThrow('PORT');
	});

	test('Чтение process.env, если источник не передан', () => {
		const ProcessEnvSchema = z.object({ PATH: z.string() });
		expect(parseEnv(ProcessEnvSchema, TITLE).PATH).toBe(process.env.PATH ?? '');
	});
});
