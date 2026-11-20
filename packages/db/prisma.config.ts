import path from 'node:path';
import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

// .env лежит в корне монорепо; в CI/проде переменные приходят из окружения.
config({ path: path.resolve(import.meta.dirname, '../../.env'), quiet: true });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  // Не env(): `prisma generate` (postinstall, CI) должен работать без БД.
  datasource: { url: process.env.DATABASE_URL ?? '' },
});
