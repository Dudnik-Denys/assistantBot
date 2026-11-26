import {
	TRAILING_PUNCTUATION,
	URL_PATTERN,
	URL_PROTOCOL_PREFIX,
	URL_TRAILING_SLASH,
} from '#lib/constants/links.ts';

export type Segment =
	| { type: 'text'; value: string }
	| { type: 'link'; value: string; href: string };

/** Разбивает текст на обычные фрагменты и ссылки. */
export function linkify(text: string): Segment[] {
	const segments: Segment[] = [];
	let last = 0;
	for (const match of text.matchAll(URL_PATTERN)) {
		let url = match[0];
		const trailing = url.match(TRAILING_PUNCTUATION)?.[0] ?? '';
		if (trailing) url = url.slice(0, -trailing.length);
		const start = match.index;
		if (start > last) segments.push({ type: 'text', value: text.slice(last, start) });
		segments.push({
			type: 'link',
			value: url,
			href: url.startsWith('www.') ? `https://${url}` : url,
		});
		last = start + url.length;
	}
	if (last < text.length) segments.push({ type: 'text', value: text.slice(last) });
	return segments;
}

/** Адрес для показа: без протокола и завершающего `/` (`https://site.com/` → `site.com`). */
export function displayUrl(url: string): string {
	return url.replace(URL_PROTOCOL_PREFIX, '').replace(URL_TRAILING_SLASH, '');
}
