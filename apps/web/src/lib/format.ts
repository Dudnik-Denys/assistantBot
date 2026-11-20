const time = new Intl.DateTimeFormat('ru', { hour: '2-digit', minute: '2-digit' });
const dayMonth = new Intl.DateTimeFormat('ru', { day: 'numeric', month: 'short' });
const full = new Intl.DateTimeFormat('ru', { day: 'numeric', month: 'short', year: 'numeric' });

export function formatNoteDate(iso: string, now = new Date()): string {
	const d = new Date(iso);
	if (d.toDateString() === now.toDateString()) return time.format(d);
	if (d.getFullYear() === now.getFullYear()) return dayMonth.format(d);
	return full.format(d);
}
