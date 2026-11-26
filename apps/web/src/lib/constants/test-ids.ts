/**
 * Идентификаторы элементов для e2e-тестов (`data-testid`) — один источник для приложения и
 * тестов (`.claude/rules/e2e.md`, «Элементы и `data-testid`»). Значение — `'<экран>.<элемент>'`;
 * элементы базовых компонентов `ui/`, которые есть на многих экранах, — группа `Common`
 * (идентификатор ставит сам компонент). Файл без зависимостей: его импортируют и компоненты
 * (`#lib/constants/test-ids.ts`), и тесты (`#web/lib/constants/test-ids.ts`).
 */
export const TestId = {
	MainMenu: { List: 'main-menu.list', Section: 'main-menu.section' },
	NotesList: {
		Card: 'notes-list.card',
		Empty: 'notes-list.empty',
		NotFound: 'notes-list.not-found',
	},
	NoteEditor: {
		Title: 'note-editor.title',
		Content: 'note-editor.content',
		Hint: 'note-editor.hint',
	},
	ErrorPage: { Message: 'error-page.message' },
	/** Элементы базовых компонентов `ui/`: идентификатор ставит сам компонент. */
	Common: {
		Back: 'common.back',
		Search: 'common.search',
		SearchClear: 'common.search-clear',
		FloatingButton: 'common.floating-button',
		SwipeRow: 'common.swipe-row',
		SwipeDelete: 'common.swipe-delete',
		Loading: 'common.loading',
		Offline: 'common.offline',
		ListError: 'common.list-error',
	},
} as const;

/**
 * Идентификатор со значением — когда текст не различает элементы или тест знает id записи:
 * `testIdWithValue(TestId.CountersList.Row, counter.id)` → `'counters-list.row=<id>'`.
 */
export function testIdWithValue(id: string, value: string): string {
	return `${id}=${value}`;
}
