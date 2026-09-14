ALTER TABLE "Standing" ADD COLUMN "sourceTeamId" TEXT;

-- Existing rows lack their source-pool context. Keep each team's own row so the
-- next sync can safely replace it with the complete pool for that team.
UPDATE "Standing" SET "sourceTeamId" = "teamId";

ALTER TABLE "Standing" ALTER COLUMN "sourceTeamId" SET NOT NULL;
DROP INDEX "Standing_seasonId_competition_teamId_key";
CREATE UNIQUE INDEX "Standing_seasonId_competition_sourceTeamId_teamId_key" ON "Standing"("seasonId", "competition", "sourceTeamId", "teamId");
CREATE INDEX "Standing_sourceTeamId_seasonId_competition_idx" ON "Standing"("sourceTeamId", "seasonId", "competition");
ALTER TABLE "Standing" ADD CONSTRAINT "Standing_sourceTeamId_fkey" FOREIGN KEY ("sourceTeamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
