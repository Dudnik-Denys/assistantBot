export type Segment =
	| { type: 'text'; value: string }
	| { type: 'link'; value: string; href: string };

const URL_RE = /\b(?:https?:\/\/|www\.)[^\s<>"']+/gi;
const TRAILING_PUNCT = /[.,;:!?)\]}»"']+$/;

/** Разбивает текст на обычные фрагменты и ссылки. */
export function linkify(text: string): Segment[] {
	const segments: Segment[] = [];
	let last = 0;
	for (const match of text.matchAll(URL_RE)) {
		let url = match[0];
		const trailing = url.match(TRAILING_PUNCT)?.[0] ?? '';
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

export function displayUrl(url: string): string {
	return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
}
