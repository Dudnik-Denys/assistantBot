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
		Title: 'notes-list.title',
		Empty: 'notes-list.empty',
		NotFound: 'notes-list.not-found',
	},
	NoteEditor: {
		Title: 'note-editor.title',
		Content: 'note-editor.content',
		Hint: 'note-editor.hint',
	},
	CountersList: {
		/** Вкладка списка — со значением: `testIdWithValue(Tab, 'paused')`. */
		Tab: 'counters-list.tab',
		Card: 'counters-list.card',
		Title: 'counters-list.title',
		Status: 'counters-list.status',
		Value: 'counters-list.value',
		Empty: 'counters-list.empty',
		EmptyTab: 'counters-list.empty-tab',
	},
	CounterForm: {
		Title: 'counter-form.title',
		/** Режим таймера — со значением: `testIdWithValue(Mode, 'DURATION')`. */
		Mode: 'counter-form.mode',
		/** Часть срока — со значением: `testIdWithValue(DurationPart, 'hours')`. */
		DurationPart: 'counter-form.duration-part',
		TargetDate: 'counter-form.target-date',
		TargetTime: 'counter-form.target-time',
		Problem: 'counter-form.problem',
		Submit: 'counter-form.submit',
	},
	Counter: {
		Countdown: 'counter.countdown',
		TimerStatus: 'counter.timer-status',
		Cycles: 'counter.cycles',
		Value: 'counter.value',
		Decrement: 'counter.decrement',
		Increment: 'counter.increment',
		/** «Старт» и «Продолжить». */
		Start: 'counter.start',
		Stop: 'counter.stop',
		Reset: 'counter.reset',
		Edit: 'counter.edit',
		Delete: 'counter.delete',
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
		ListError: 'common.list-error',
	},
} as const;

/**
 * Идентификатор со значением — когда текст не различает элементы или тест знает id записи:
 * `testIdWithValue(TestId.CountersList.Tab, 'paused')` → `'counters-list.tab=paused'`.
 */
export function testIdWithValue(id: string, value: string): string {
	return `${id}=${value}`;
}
