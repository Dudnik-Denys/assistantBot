import type { Context, NextFunction, Transformer } from 'grammy';

/** Лог входящих апдейтов — помогает разбираться с дублями и ошибками. */
export async function logUpdates(ctx: Context, next: NextFunction): Promise<void> {
	const text = ctx.message?.text ?? ctx.callbackQuery?.data ?? '';
	console.log(`← update ${ctx.update.update_id} from ${ctx.from?.id}: ${text}`);
	await next();
}

/** Лог исходящих вызовов Bot API с длительностью (кроме getUpdates — его вызывает polling). */
export const logApiCalls: Transformer = async (prev, method, payload, signal) => {
	const started = Date.now();
	const res = await prev(method, payload, signal);
	if (method !== 'getUpdates')
		console.log(`→ ${method} ${res.ok ? 'ok' : res.description} (${Date.now() - started} ms)`);
	return res;
};
