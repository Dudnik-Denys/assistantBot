import { NOTE_TITLE_REQUIRED_MESSAGE } from '@tgab/core/constants/notes';

// Константы раздела «Заметки» Mini App (только для него). Файл без `$app/*`: тексты проверяют
// e2e-тесты (`#web/lib/constants/notes.ts`), а не повторяют их строками.

/** Тексты редактора заметки. */
export const NoteEditorText = {
	/** Подсказка под заголовком, пока его нет, а текст уже есть. */
	UntitledHint: `${NOTE_TITLE_REQUIRED_MESSAGE} — без него заметка не сохранится`,
	/** «Назад» из заметки без заголовка. */
	LeaveUntitled: 'Заметка без заголовка не сохранится. Выйти?',
	/** «Назад», когда сохранить изменения не удалось. */
	LeaveUnsaved: 'Не удалось сохранить изменения. Выйти?',
} as const;
