-- Значение по умолчанию для timezone задаёт код (DEFAULT_TIMEZONE в packages/core), а не БД.
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "timezone" DROP DEFAULT;
