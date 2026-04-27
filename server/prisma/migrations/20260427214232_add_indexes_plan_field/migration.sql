-- AlterTable
ALTER TABLE "users" ADD COLUMN     "plan" TEXT NOT NULL DEFAULT 'FREE';

-- CreateIndex
CREATE INDEX "documents_userId_idx" ON "documents"("userId");

-- CreateIndex
CREATE INDEX "pomodoro_sessions_userId_idx" ON "pomodoro_sessions"("userId");

-- CreateIndex
CREATE INDEX "pomodoro_sessions_userId_completed_idx" ON "pomodoro_sessions"("userId", "completed");

-- CreateIndex
CREATE INDEX "pomodoro_sessions_userId_createdAt_idx" ON "pomodoro_sessions"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "tasks_userId_idx" ON "tasks"("userId");

-- CreateIndex
CREATE INDEX "tasks_userId_status_idx" ON "tasks"("userId", "status");

-- CreateIndex
CREATE INDEX "tasks_userId_updatedAt_idx" ON "tasks"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "weekly_digests_userId_idx" ON "weekly_digests"("userId");
