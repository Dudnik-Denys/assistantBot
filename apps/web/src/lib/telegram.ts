/** Кнопка системного диалога `showPopup`; без `id` нажатие возвращает пустую строку. */
interface PopupButton {
	id?: string;
	type?: 'default' | 'destructive' | 'cancel';
	text?: string;
}

/** Минимальные типы той части Telegram.WebApp, которой пользуется приложение. */
interface TelegramWebApp {
	initData: string;
	platform: string;
	ready(): void;
	expand(): void;
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
		onClick(cb: () => void): void;
		offClick(cb: () => void): void;
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

export function initTelegram(): void {
	const app = webApp();
	if (!app) return;
	app.ready();
	app.expand();
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

const CONFIRM_BUTTON_ID = 'confirm';

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
	const h = webApp()?.HapticFeedback;
	if (!isInTelegram() || !h) return;
	if (type === 'light') h.impactOccurred('light');
	else h.notificationOccurred(type);
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
