CREATE TYPE "MatchTaskType" AS ENUM ('balls', 'driving', 'bottles');

CREATE TABLE "MatchTask" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "taskType" "MatchTaskType" NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchTask_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MatchTask_matchId_taskType_userId_key" ON "MatchTask"("matchId", "taskType", "userId");
CREATE INDEX "MatchTask_matchId_teamId_taskType_idx" ON "MatchTask"("matchId", "teamId", "taskType");

ALTER TABLE "MatchTask" ADD CONSTRAINT "MatchTask_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MatchTask" ADD CONSTRAINT "MatchTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
