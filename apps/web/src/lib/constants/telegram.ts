/** Версия Bot API, с которой есть полноэкранный режим (`requestFullscreen`). */
export const FULLSCREEN_MIN_VERSION = '8.0';

/** Платформы Telegram на телефонах: на компьютере полный экран занял бы весь монитор. */
export const MOBILE_PLATFORMS: readonly string[] = ['ios', 'android', 'android_x'];

/** Ключ темы, которым окрашена страница: --color-page в app.css — второй цвет темы. */
export const PAGE_COLOR_KEY = 'secondary_bg_color';

/** id кнопки подтверждения в `showPopup`: по нему отличаем её нажатие от «Отмены». */
export const CONFIRM_BUTTON_ID = 'confirm';
