import { errorMessage } from '#lib/errors.ts';
import { alertDialog, confirmDialog, haptic } from '#lib/telegram.ts';

type HapticType = Parameters<typeof haptic>[0];

/**
 * Действие из интерфейса с откликом: при успехе — вибрация `success`, при ошибке — вибрация
 * и диалог с текстом ошибки. Возвращает `{ value }` или null, если действие не удалось.
 */
export async function runWithFeedback<T>(
	action: () => Promise<T>,
	success: HapticType = 'light',
): Promise<{ value: T } | null> {
	try {
		const value = await action();
		haptic(success);
		return { value };
	} catch (actionError) {
		haptic('error');
		await alertDialog(errorMessage(actionError));
		return null;
	}
}

/** Подтверждение удаления: «Вы уверены, что хотите удалить {subject}?» с кнопками «Да» / «Нет». */
function confirmRemoval(subject: string): Promise<boolean> {
	return confirmDialog(`Вы уверены, что хотите удалить ${subject}?`, {
		confirmText: 'Да',
		cancelText: 'Нет',
		destructive: true,
	});
}

/** Удаление с подтверждением и откликом. true — удалено. */
export async function removeWithConfirm(
	subject: string,
	remove: () => Promise<void>,
): Promise<boolean> {
	if (!(await confirmRemoval(subject))) return false;
	return (await runWithFeedback(remove, 'warning')) !== null;
}
