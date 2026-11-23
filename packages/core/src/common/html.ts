/** Экранирует текст для сообщений Telegram с `parse_mode: 'HTML'` (`<`, `>`, `&`). */
export function escapeHtml(text: string): string {
	return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
