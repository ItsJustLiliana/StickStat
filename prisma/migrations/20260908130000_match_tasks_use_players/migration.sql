ALTER TABLE "MatchTask" ADD COLUMN IF NOT EXISTS "playerId" TEXT;

UPDATE "MatchTask" AS task
SET "playerId" = player.id
FROM "Player" AS player
WHERE player."userId" = task."userId"
  AND player."teamId" = task."teamId";

ALTER TABLE "MatchTask" ALTER COLUMN "userId" DROP NOT NULL;
DROP INDEX IF EXISTS "MatchTask_matchId_taskType_userId_key";
CREATE UNIQUE INDEX "MatchTask_matchId_taskType_playerId_key" ON "MatchTask"("matchId", "taskType", "playerId");
ALTER TABLE "MatchTask" ADD CONSTRAINT "MatchTask_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
