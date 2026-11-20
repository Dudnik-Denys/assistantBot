function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Не задана переменная окружения ${name}`);
  return value;
}

function telegramId(name: string): bigint | null {
  const value = process.env[name];
  if (!value) return null;
  if (!/^\d+$/.test(value)) throw new Error(`${name}: ожидается числовой telegramId`);
  return BigInt(value);
}

export const env = {
  BOT_TOKEN: required('BOT_TOKEN'),
  DATABASE_URL: required('DATABASE_URL'),
  ADMIN_TELEGRAM_ID: telegramId('ADMIN_TELEGRAM_ID'),
  /** HTTPS-адрес Mini App; если задан, /start показывает кнопку открытия. */
  MINI_APP_URL: process.env.MINI_APP_URL || null,
};
