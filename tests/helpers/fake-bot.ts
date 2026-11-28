import { Bot, Composer, type Middleware } from 'grammy';
import type { MessageEntity, Update, UserFromGetMe } from 'grammy/types';
import { type BotContext, hasUser, type PrivateContext } from '#bot/context.ts';
import {
	FAKE_ALLOWED_USER,
	FAKE_BOT_ID,
	FAKE_BOT_TOKEN,
	FAKE_BOT_USERNAME,
	FAKE_USER_ID,
} from '../constants/bot.ts';

/** Вызов Bot API, который перехватил фейковый бот. */
export interface FakeApiCall {
	method: string;
	payload: Record<string, unknown>;
}

const BOT_INFO: UserFromGetMe = {
	id: FAKE_BOT_ID,
	is_bot: true,
	first_name: 'Тестовый бот',
	username: FAKE_BOT_USERNAME,
	can_join_groups: false,
	can_read_all_group_messages: false,
	supports_inline_queries: false,
	can_connect_to_business: false,
	has_main_web_app: false,
	has_topics_enabled: false,
	allows_users_to_create_topics: false,
	can_manage_bots: false,
	supports_join_request_queries: false,
};

let nextUpdateId = 1;

/** Апдейт с текстовым сообщением в личном чате; `/команда` в начале — сущность bot_command. */
function messageUpdate(text: string, fromId: number): Update {
	const command = text.match(/^\/\S+/)?.[0];
	const entities: MessageEntity[] = command
		? [{ type: 'bot_command', offset: 0, length: command.length }]
		: [];
	const from = { id: fromId, is_bot: false, first_name: 'Друг' };
	const updateId = nextUpdateId++;
	return {
		update_id: updateId,
		message: {
			message_id: updateId,
			date: 0,
			chat: { id: fromId, type: 'private', first_name: from.first_name },
			from,
			text,
			entities,
		},
	};
}

/**
 * Бот grammY без сети — для тестов роутеров и middleware настоящими апдейтами: `botInfo` задан
 * заранее (нет `getMe`), а каждый вызов Bot API перехватывает трансформер — запоминает его
 * в `calls` и отвечает «ok», ничего не отправляя в Telegram.
 */
export function createFakeBot(...middleware: Middleware<BotContext>[]) {
	const calls: FakeApiCall[] = [];
	const bot = new Bot<BotContext>(FAKE_BOT_TOKEN, { botInfo: BOT_INFO });
	bot.api.config.use(async (_callApi, method, payload) => {
		calls.push({ method, payload: { ...payload } });
		// Ответ Telegram здесь не важен: проверяется сам вызов. Тип результата у каждого метода
		// свой, а трансформер общий — `true` подходит как «успех» для любого.
		return { ok: true, result: true as never };
	});
	bot.use(...middleware);
	return {
		calls,
		/** Отправить боту текст от пользователя `fromId`. */
		send: (text: string, fromId = FAKE_USER_ID) => bot.handleUpdate(messageUpdate(text, fromId)),
	};
}

/**
 * Приватный роутер (после allowlist) для фейкового бота: `ctx.user` уже записан, как это делает
 * allowlist. `createFakeBot(withUser(createStartRouter(deps)))`.
 */
export function withUser(
	router: Middleware<PrivateContext>,
	user = FAKE_ALLOWED_USER,
): Middleware<BotContext> {
	const composer = new Composer<BotContext>();
	composer.use((ctx, next) => {
		ctx.user = user;
		return next();
	});
	composer.filter(hasUser, router);
	return composer;
}
