import {
	CONFIRM_BUTTON_ID,
	FULLSCREEN_MIN_VERSION,
	MOBILE_PLATFORMS,
	PAGE_COLOR_KEY,
} from '#lib/constants/telegram.ts';

/** Кнопка системного диалога `showPopup`; без `id` нажатие возвращает пустую строку. */
interface PopupButton {
	id?: string;
	type?: 'default' | 'destructive' | 'cancel';
	text?: string;
}

/** Цвет темы Telegram по ключу — для шапки, фона и нижней панели клиента. */
type ThemeColorKey = 'bg_color' | 'secondary_bg_color';

/** Минимальные типы той части Telegram.WebApp, которой пользуется приложение. */
interface TelegramWebApp {
	initData: string;
	platform: string;
	ready(): void;
	expand(): void;
	/**
	 * Bot API 7.7+: жесты по содержимому не сворачивают приложение (в старых клиентах метода нет).
	 */
	disableVerticalSwipes?(): void;
	isVersionAtLeast?(version: string): boolean;
	/** Bot API 8.0+: приложение на весь экран, кнопки Telegram — поверх него. */
	requestFullscreen?(): void;
	/** Цвета шапки, фона под приложением и нижней панели Telegram — ключом темы или hex. */
	setHeaderColor?(color: ThemeColorKey): void;
	setBackgroundColor?(color: ThemeColorKey): void;
	/** Bot API 7.10+. */
	setBottomBarColor?(color: ThemeColorKey): void;
	openLink(url: string): void;
	showConfirm(message: string, callback: (ok: boolean) => void): void;
	showAlert(message: string, callback?: () => void): void;
	showPopup(
		params: {
			title?: string;
			message: string;
			buttons?: PopupButton[];
		},
		callback?: (buttonId: string) => void,
	): void;
	BackButton: {
		show(): void;
		hide(): void;
		onClick(callback: () => void): void;
		offClick(callback: () => void): void;
	};
	HapticFeedback?: {
		notificationOccurred(type: 'error' | 'success' | 'warning'): void;
		impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
	};
}

declare global {
	interface Window {
		Telegram?: { WebApp?: TelegramWebApp };
	}
}

export function webApp(): TelegramWebApp | undefined {
	return typeof window === 'undefined' ? undefined : window.Telegram?.WebApp;
}

/** true, если страница открыта внутри Telegram (а не в обычном браузере). */
export function isInTelegram(): boolean {
	return Boolean(webApp()?.initData);
}

/** Открывать ли приложение на весь экран: только на телефоне и в клиенте с Bot API 8.0+. */
export function shouldUseFullscreen(platform: string, supportsFullscreen: boolean): boolean {
	return supportsFullscreen && MOBILE_PLATFORMS.includes(platform);
}

export function initTelegram(): void {
	const app = webApp();
	if (!app) return;
	app.ready();
	app.expand();
	// Свайпы внутри приложения (по списку, по строкам) не тянут его вниз;
	// закрыть можно кнопками Telegram (в обычном режиме — и потянув за его шапку).
	app.disableVerticalSwipes?.();
	// На весь экран: свечение фона доходит до верха, кнопки «×» и «…» — поверх него.
	// Отступы под них и под вырез экрана — токены page-* (--tg-content-safe-area-inset-*).
	// В старых клиентах метода нет (вызов бросил бы ошибку) — там остаётся обычная шапка.
	if (shouldUseFullscreen(app.platform, app.isVersionAtLeast?.(FULLSCREEN_MIN_VERSION) ?? false)) {
		app.requestFullscreen?.();
	}
	// Шапка и края Telegram — цветом страницы (--color-page в app.css), а не основным фоном темы.
	app.setHeaderColor?.(PAGE_COLOR_KEY);
	app.setBackgroundColor?.(PAGE_COLOR_KEY);
	app.setBottomBarColor?.(PAGE_COLOR_KEY);
}

export function openLink(url: string): void {
	const app = webApp();
	if (isInTelegram() && app) app.openLink(url);
	else window.open(url, '_blank', 'noopener');
}

/** Свои подписи кнопок диалога вместо стандартных «OK» / «Отмена». */
export interface ConfirmOptions {
	confirmText: string;
	cancelText: string;
	/** Подтверждение — опасное действие (удаление): кнопка красная. */
	destructive?: boolean;
}

/**
 * Диалог подтверждения: true — пользователь согласился. В Telegram — системный диалог
 * (`showConfirm`, с `options` — `showPopup` со своими кнопками), в браузере — `window.confirm`.
 */
export function confirmDialog(message: string, options?: ConfirmOptions): Promise<boolean> {
	const app = webApp();
	if (!isInTelegram() || !app) return Promise.resolve(window.confirm(message));
	if (!options) return new Promise((resolve) => app.showConfirm(message, resolve));
	const buttons: PopupButton[] = [
		{
			id: CONFIRM_BUTTON_ID,
			type: options.destructive ? 'destructive' : 'default',
			text: options.confirmText,
		},
		{ type: 'default', text: options.cancelText },
	];
	return new Promise((resolve) =>
		app.showPopup({ message, buttons }, (buttonId) => resolve(buttonId === CONFIRM_BUTTON_ID)),
	);
}

/** Сообщение с кнопкой «OK»: в Telegram — системное, в браузере — `window.alert`. */
export function alertDialog(message: string): Promise<void> {
	const app = webApp();
	if (!isInTelegram() || !app) {
		window.alert(message);
		return Promise.resolve();
	}
	return new Promise((resolve) => app.showAlert(message, resolve));
}

export function haptic(type: 'success' | 'error' | 'warning' | 'light'): void {
	const hapticFeedback = webApp()?.HapticFeedback;
	if (!isInTelegram() || !hapticFeedback) return;
	if (type === 'light') hapticFeedback.impactOccurred('light');
	else hapticFeedback.notificationOccurred(type);
}

/**
 * Показывает системную кнопку «Назад» Telegram, пока компонент смонтирован.
 * Использовать внутри $effect: возвращает функцию очистки.
 */
export function useBackButton(onBack: () => void): () => void {
	const app = webApp();
	if (!isInTelegram() || !app) return () => {};
	app.BackButton.show();
	app.BackButton.onClick(onBack);
	return () => {
		app.BackButton.offClick(onBack);
		app.BackButton.hide();
	};
}
