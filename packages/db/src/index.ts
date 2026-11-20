import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client.ts';

export { PrismaClient, Prisma } from './generated/prisma/client.ts';
export type { User, Note } from './generated/prisma/client.ts';

export function createPrismaClient(databaseUrl: string): PrismaClient {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
}
