import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client.ts';

// PrismaClient — только тип: клиент создаётся через createPrismaClient (с адаптером pg).
export type {
	Counter,
	CounterNotification,
	Note,
	PrismaClient,
	User,
} from './generated/prisma/client.ts';
export { Prisma } from './generated/prisma/client.ts';

export function createPrismaClient(databaseUrl: string): PrismaClient {
	return new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
}
