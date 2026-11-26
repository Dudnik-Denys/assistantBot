import type { BasePage } from '../../base.page.ts';
import type { MainMenuPage } from '../main-menu.page.ts';

/** Вход в модуль из главного меню: главная → раздел `title` → экран раздела `section`. */
export async function openSection(
	mainMenu: MainMenuPage,
	title: string,
	section: BasePage,
): Promise<void> {
	await mainMenu.open();
	await mainMenu.openSection(title);
	await section.expectOpened();
}
