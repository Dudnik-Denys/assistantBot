import type { NoteEditorPage } from '../note-editor.page.ts';
import type { NotesListPage } from '../notes-list.page.ts';

/** Новая заметка через интерфейс: список → «+» → редактор (автосохранение) → «Назад» → список. */
export async function createNoteViaUi(
	notesList: NotesListPage,
	noteEditor: NoteEditorPage,
	title: string,
	content = '',
): Promise<void> {
	await notesList.openNewNote();
	await noteEditor.expectOpened();
	await noteEditor.fillAndWaitSaved(title, content);
	await noteEditor.goBack();
	await notesList.expectOpened();
}
