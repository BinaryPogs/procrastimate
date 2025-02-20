-- AlterTable
ALTER TABLE "Todo" ADD COLUMN     "pointsAwarded" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Friendship_requesterId_status_idx" ON "Friendship"("requesterId", "status");

-- CreateIndex
CREATE INDEX "Friendship_receiverId_status_idx" ON "Friendship"("receiverId", "status");

-- CreateIndex
CREATE INDEX "Todo_userId_completed_deadline_idx" ON "Todo"("userId", "completed", "deadline");

-- CreateIndex
CREATE INDEX "Todo_userId_failed_idx" ON "Todo"("userId", "failed");

-- CreateIndex
CREATE INDEX "User_isGuest_createdAt_idx" ON "User"("isGuest", "createdAt");
