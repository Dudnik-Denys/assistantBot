// Добавляет telegramId в allowlist: bun run user:allow <telegramId> [--admin]
import path from 'node:path';
import { config } from 'dotenv';
import { createPrismaClient } from '../src/index.ts';

config({ path: path.resolve(import.meta.dirname, '../../../.env'), quiet: true });

const [rawId, ...flags] = process.argv.slice(2);
if (!rawId || !/^\d+$/.test(rawId)) {
  console.error('Использование: bun run user:allow <telegramId> [--admin]');
  process.exit(1);
}
const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL не задан');

const db = createPrismaClient(url);
const isAdmin = flags.includes('--admin');
const user = await db.user.upsert({
  where: { telegramId: BigInt(rawId) },
  create: { telegramId: BigInt(rawId), isAdmin },
  update: isAdmin ? { isAdmin } : {},
});
console.log(`OK: ${user.telegramId} (admin: ${user.isAdmin})`);
await db.$disconnect();
