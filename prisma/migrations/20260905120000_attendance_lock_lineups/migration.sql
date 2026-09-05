ALTER TABLE "Training" ADD COLUMN "attendanceLocked" BOOLEAN NOT NULL DEFAULT false;
CREATE TABLE "MatchTeamPlan" (
 "id" TEXT NOT NULL, "matchId" TEXT NOT NULL, "teamId" TEXT NOT NULL,
 "attendanceLocked" BOOLEAN NOT NULL DEFAULT false,
 "formation" TEXT NOT NULL DEFAULT '4-3-3', "positions" JSONB NOT NULL DEFAULT '[]',
 CONSTRAINT "MatchTeamPlan_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "MatchTeamPlan_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 CONSTRAINT "MatchTeamPlan_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "MatchTeamPlan_matchId_teamId_key" ON "MatchTeamPlan"("matchId", "teamId");
