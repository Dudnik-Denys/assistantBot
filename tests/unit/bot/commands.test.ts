import { describe, expect, test } from 'bun:test';
import { idRouter } from '#bot/routers/commands/id.ts';
import { createStartRouter } from '#bot/routers/commands/start.ts';
import { FAKE_USER_ID } from '../../constants/bot.ts';
import { createFakeBot } from '../../helpers/fake-bot.ts';

const MINI_APP_URL = 'https://app.example.com/';

describe('/start', () => {
	test('Приветствие с кнопкой Mini App', async () => {
		const fake = createFakeBot(createStartRouter({ miniAppUrl: MINI_APP_URL }));
		await fake.send('/start');

		expect(fake.calls).toHaveLength(1);
		const [call] = fake.calls;
		expect(call?.method).toBe('sendMessage');
		expect(call?.payload.text).toStartWith('Здравствуйте!');
		expect(JSON.stringify(call?.payload.reply_markup)).toContain(MINI_APP_URL);
	});

	test('Без адреса Mini App — приветствие без кнопки и с подсказкой', async () => {
		const fake = createFakeBot(createStartRouter({ miniAppUrl: undefined }));
		await fake.send('/start');

		const [call] = fake.calls;
		expect(call?.payload.reply_markup).toBeUndefined();
		expect(call?.payload.text).toContain('MINI_APP_URL');
	});

	test('Другие сообщения роутер пропускает', async () => {
		const fake = createFakeBot(createStartRouter({ miniAppUrl: MINI_APP_URL }));
		await fake.send('/id');
		await fake.send('привет');
		expect(fake.calls).toEqual([]);
	});
});

describe('/id', () => {
	test('Ответ с Telegram ID отправителя в HTML', async () => {
		const fake = createFakeBot(idRouter);
		await fake.send('/id');

		const [call] = fake.calls;
		expect(call?.payload).toMatchObject({
			text: `Ваш Telegram ID: <code>${FAKE_USER_ID}</code>`,
			parse_mode: 'HTML',
		});
	});
});
