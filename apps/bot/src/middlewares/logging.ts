import type { Context, NextFunction, Transformer } from 'grammy';

/**
 * Лог входящих апдейтов — помогает разбираться с дублями и ошибками. Текст сообщений не пишется
 * (там личные данные пользователей): только тип апдейта и команда (`message /start`).
 */
export async function logUpdates(ctx: Context, next: NextFunction): Promise<void> {
	const kind = Object.keys(ctx.update).find((key) => key !== 'update_id') ?? 'unknown';
	const command = ctx.entities('bot_command')[0]?.text;
	const summary = command ? `${kind} ${command}` : kind;
	console.log(`← update ${ctx.update.update_id} from ${ctx.from?.id}: ${summary}`);
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
