/** Сколько первых слов запроса участвует в поиске: длинный запрос не раздувает tsquery. */
export const SEARCH_WORDS_MAX = 10;

/**
 * Строит строку для to_tsquery с префиксным поиском по каждому слову:
 * "погода киев" → "погода:* & киев:*". Возвращает null, если искать нечего.
 * Спецсимволы tsquery отбрасываются, поэтому пользовательский ввод безопасен.
 */
export function buildPrefixTsQuery(input: string): string | null {
	const words = input.toLowerCase().match(/[\p{L}\p{N}]+/gu);
	if (!words?.length) return null;
	return words
		.slice(0, SEARCH_WORDS_MAX)
		.map((word) => `${word}:*`)
		.join(' & ');
}
