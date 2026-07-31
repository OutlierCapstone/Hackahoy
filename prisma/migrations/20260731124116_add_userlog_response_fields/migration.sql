-- AlterTable
ALTER TABLE "UserLog" ADD COLUMN     "elapsedMs" INTEGER,
ADD COLUMN     "query" TEXT,
ADD COLUMN     "respBytes" INTEGER,
ADD COLUMN     "status" INTEGER;

-- CreateIndex
CREATE INDEX "UserLog_userId_problemId_createdAt_idx" ON "UserLog"("userId", "problemId", "createdAt");
