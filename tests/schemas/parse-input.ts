import { z } from 'zod';
import { SAMPLE_TITLE_MESSAGE } from '../constants/parse-input.ts';

/** Ввод-образец для `parseInput`: название, обрезка пробелов, свой текст ошибки. */
export const SampleInputSchema = z.object({
	title: z.string().trim().min(1, SAMPLE_TITLE_MESSAGE),
});
