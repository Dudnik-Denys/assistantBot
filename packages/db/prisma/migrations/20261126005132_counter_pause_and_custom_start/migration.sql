-- AlterEnum
ALTER TYPE "CounterTimerStatus" ADD VALUE 'PAUSED';

-- AlterTable
ALTER TABLE "Counter" ADD COLUMN     "customStart" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pausedAt" TIMESTAMPTZ(3),
ADD COLUMN     "startStopHidden" BOOLEAN NOT NULL DEFAULT false;


-- Изменено вручную: у существующих счётчиков «на срок» старт был задан вручную в форме —
-- новое поле по умолчанию значит «старт в момент сохранения», поэтому им ставим true.
UPDATE "Counter" SET "customStart" = true WHERE "timerMode" = 'DURATION';
