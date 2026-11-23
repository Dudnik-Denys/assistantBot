-- CreateEnum
CREATE TYPE "CounterTimerMode" AS ENUM ('DURATION', 'DATE');

-- CreateEnum
CREATE TYPE "CounterTimerStatus" AS ENUM ('RUNNING', 'FINISHED');

-- CreateTable
CREATE TABLE "Counter" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "manual" BOOLEAN NOT NULL,
    "showValue" BOOLEAN NOT NULL,
    "timerMode" "CounterTimerMode",
    "durationMonths" INTEGER NOT NULL,
    "durationWeeks" INTEGER NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "durationHours" INTEGER NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "startAt" TIMESTAMPTZ(3),
    "targetAt" TIMESTAMPTZ(3),
    "timerStatus" "CounterTimerStatus",
    "finishedAt" TIMESTAMPTZ(3),
    "repeatSame" BOOLEAN NOT NULL,
    "autoRestart" BOOLEAN NOT NULL,
    "notify" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Counter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CounterNotification" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "counterId" UUID NOT NULL,
    "cycle" INTEGER NOT NULL,
    "finishedAt" TIMESTAMPTZ(3) NOT NULL,
    "readAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CounterNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Counter_userId_createdAt_idx" ON "Counter"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Counter_timerStatus_targetAt_idx" ON "Counter"("timerStatus", "targetAt");

-- CreateIndex
CREATE INDEX "CounterNotification_userId_createdAt_idx" ON "CounterNotification"("userId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "CounterNotification_counterId_finishedAt_key" ON "CounterNotification"("counterId", "finishedAt");

-- AddForeignKey
ALTER TABLE "Counter" ADD CONSTRAINT "Counter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounterNotification" ADD CONSTRAINT "CounterNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounterNotification" ADD CONSTRAINT "CounterNotification_counterId_fkey" FOREIGN KEY ("counterId") REFERENCES "Counter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
