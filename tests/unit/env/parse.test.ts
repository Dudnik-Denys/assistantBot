import { describe, expect, test } from 'bun:test';
import { parseEnv } from '#core/env/parse.ts';
import { ProcessPathEnvSchema, SampleEnvSchema } from '../../schemas/parse-env.ts';

const TITLE = 'Некорректные переменные окружения:';

describe('parseEnv', () => {
	test('Возврат разобранных значений для корректного окружения', () => {
		expect(parseEnv(SampleEnvSchema, TITLE, { TOKEN: 'secret', PORT: '8080' })).toEqual({
			TOKEN: 'secret',
			PORT: 8080,
		});
	});

	test('Выброс ошибки с заголовком и всеми проблемами сразу', () => {
		const parse = () => parseEnv(SampleEnvSchema, TITLE, { PORT: 'не число' });
		expect(parse).toThrow(TITLE);
		expect(parse).toThrow('TOKEN');
		expect(parse).toThrow('PORT');
	});

	test('Чтение process.env, если источник не передан', () => {
		expect(parseEnv(ProcessPathEnvSchema, TITLE).PATH).toBe(process.env.PATH ?? '');
	});
});
