import { describe, expect, test } from 'bun:test';
import { parseInput } from '#core/common/parse-input.ts';
import { ValidationError } from '#core/errors.ts';
import { SAMPLE_TITLE_MESSAGE } from '../../constants/parse-input.ts';
import { SampleInputSchema } from '../../schemas/parse-input.ts';

describe('parseInput', () => {
	test('Возврат разобранных данных', () => {
		expect(parseInput(SampleInputSchema, { title: ' Вода ' })).toEqual({ title: 'Вода' });
	});

	test('Выброс ValidationError с текстом первой проблемы схемы', () => {
		expect(() => parseInput(SampleInputSchema, { title: ' ' })).toThrow(
			new ValidationError(SAMPLE_TITLE_MESSAGE),
		);
	});

	test('Выброс ValidationError, а не ZodError, для ввода не той формы', () => {
		expect(() => parseInput(SampleInputSchema, 'не объект')).toThrow(ValidationError);
	});
});
