/** Минимальные типы той части Telegram.WebApp, которой пользуется приложение. */
interface TelegramWebApp {
	initData: string;
	platform: string;
	ready(): void;
	expand(): void;
	openLink(url: string): void;
	showConfirm(message: string, callback: (ok: boolean) => void): void;
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

export function confirmDialog(message: string): Promise<boolean> {
	const app = webApp();
	if (!isInTelegram() || !app) return Promise.resolve(window.confirm(message));
	return new Promise((resolve) => app.showConfirm(message, resolve));
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
