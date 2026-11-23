import type { Context, NextFunction, Transformer } from 'grammy';

/** Лог входящих апдейтов — помогает разбираться с дублями и ошибками. */
export async function logUpdates(ctx: Context, next: NextFunction): Promise<void> {
	const text = ctx.message?.text ?? ctx.callbackQuery?.data ?? '';
	console.log(`← update ${ctx.update.update_id} from ${ctx.from?.id}: ${text}`);
	await next();
}

/** Лог исходящих вызовов Bot API с длительностью (кроме getUpdates — его вызывает polling). */
export const logApiCalls: Transformer = async (callApi, method, payload, signal) => {
	const started = Date.now();
	const response = await callApi(method, payload, signal);
	if (method !== 'getUpdates')
		console.log(
			`→ ${method} ${response.ok ? 'ok' : response.description} (${Date.now() - started} ms)`,
		);
	return response;
};
