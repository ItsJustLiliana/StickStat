ALTER TABLE "MatchAttendance" ADD COLUMN "late" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "TrainingAttendance" ADD COLUMN "late" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "PlayerMatchStats" ADD COLUMN "hatTrick" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "FavoriteTeam" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FavoriteTeam_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "FavoriteTeam_userId_teamId_key" ON "FavoriteTeam"("userId", "teamId");
CREATE INDEX "FavoriteTeam_userId_createdAt_idx" ON "FavoriteTeam"("userId", "createdAt");
ALTER TABLE "FavoriteTeam" ADD CONSTRAINT "FavoriteTeam_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FavoriteTeam" ADD CONSTRAINT "FavoriteTeam_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
