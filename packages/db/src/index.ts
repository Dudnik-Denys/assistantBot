import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client.ts';

export type { Note, User } from './generated/prisma/client.ts';
export { Prisma, PrismaClient } from './generated/prisma/client.ts';

export function createPrismaClient(databaseUrl: string): PrismaClient {
	return new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
}
