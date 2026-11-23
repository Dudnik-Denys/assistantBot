-- AlterTable
ALTER TABLE "CounterNotification" ADD COLUMN     "sentAt" TIMESTAMPTZ(3);

-- CreateIndex
CREATE INDEX "CounterNotification_sentAt_createdAt_idx" ON "CounterNotification"("sentAt", "createdAt");
