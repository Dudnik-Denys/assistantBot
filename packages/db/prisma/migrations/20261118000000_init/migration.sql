-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "telegramId" BIGINT NOT NULL,
    "firstName" TEXT,
    "username" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Kyiv',
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    -- Изменено вручную: Prisma не умеет generated-колонки (в схеме — Unsupported("tsvector")).
    "search" tsvector GENERATED ALWAYS AS (to_tsvector('russian', "title" || ' ' || "content")) STORED,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");

-- CreateIndex
CREATE INDEX "Note_userId_updatedAt_idx" ON "Note"("userId", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "Note_search_idx" ON "Note" USING GIN ("search");

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

