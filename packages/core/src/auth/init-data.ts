import { createHmac, timingSafeEqual } from 'node:crypto';

export interface TelegramWebAppUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface ValidatedInitData {
  user: TelegramWebAppUser;
  authDate: Date;
}

export class InitDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InitDataError';
  }
}

/**
 * Проверяет подпись initData Telegram Mini App.
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function validateInitData(
  initData: string,
  botToken: string,
  { maxAgeSeconds = 24 * 60 * 60, now = new Date() } = {},
): ValidatedInitData {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) throw new InitDataError('В initData нет hash');
  params.delete('hash');

  const dataCheckString = [...params.entries()]
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join('\n');

  const secret = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const expected = createHmac('sha256', secret).update(dataCheckString).digest();
  const actual = Buffer.from(hash, 'hex');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    throw new InitDataError('Неверная подпись initData');
  }

  const authDateSec = Number(params.get('auth_date'));
  if (!Number.isFinite(authDateSec) || authDateSec <= 0) {
    throw new InitDataError('Некорректный auth_date');
  }
  if (now.getTime() / 1000 - authDateSec > maxAgeSeconds) {
    throw new InitDataError('initData устарели');
  }

  const rawUser = params.get('user');
  if (!rawUser) throw new InitDataError('В initData нет user');
  let user: TelegramWebAppUser;
  try {
    user = JSON.parse(rawUser);
  } catch {
    throw new InitDataError('Некорректный user в initData');
  }
  if (typeof user?.id !== 'number') throw new InitDataError('Некорректный user.id');

  return { user, authDate: new Date(authDateSec * 1000) };
}
