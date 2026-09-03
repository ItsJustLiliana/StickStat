CREATE TYPE "AttendanceStatus" AS ENUM ('present', 'unknown', 'absent');
CREATE TYPE "NotificationType" AS ENUM ('app_update', 'general');

ALTER TABLE "User" ADD COLUMN "username" TEXT;
WITH names AS (
  SELECT "id", left(lower(regexp_replace(split_part("email", '@', 1), '[^a-zA-Z0-9_.-]', '', 'g')), 28) AS base,
    row_number() OVER (PARTITION BY lower(regexp_replace(split_part("email", '@', 1), '[^a-zA-Z0-9_.-]', '', 'g')) ORDER BY "id") AS occurrence
  FROM "User"
)
UPDATE "User" SET "username" = CASE WHEN names.occurrence = 1 THEN names.base ELSE names.base || '_' || names.occurrence END FROM names WHERE "User"."id" = names."id";
ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
DROP INDEX "User_email_key";
ALTER TABLE "User" DROP COLUMN "email";

CREATE TABLE "Training" (
  "id" TEXT NOT NULL, "teamId" TEXT NOT NULL, "title" TEXT NOT NULL DEFAULT 'Training', "date" TIMESTAMP(3) NOT NULL,
  "startTime" TEXT, "endTime" TEXT, "venue" TEXT, "notes" TEXT, "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Training_pkey" PRIMARY KEY ("id"));
CREATE INDEX "Training_teamId_date_idx" ON "Training"("teamId", "date");

CREATE TABLE "MatchAttendance" (
  "id" TEXT NOT NULL, "matchId" TEXT NOT NULL, "playerId" TEXT NOT NULL, "status" "AttendanceStatus" NOT NULL DEFAULT 'unknown',
  "updatedById" TEXT NOT NULL, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MatchAttendance_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "MatchAttendance_matchId_playerId_key" ON "MatchAttendance"("matchId", "playerId");
CREATE INDEX "MatchAttendance_playerId_status_idx" ON "MatchAttendance"("playerId", "status");

CREATE TABLE "TrainingAttendance" (
  "id" TEXT NOT NULL, "trainingId" TEXT NOT NULL, "playerId" TEXT NOT NULL, "status" "AttendanceStatus" NOT NULL DEFAULT 'unknown',
  "updatedById" TEXT NOT NULL, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TrainingAttendance_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "TrainingAttendance_trainingId_playerId_key" ON "TrainingAttendance"("trainingId", "playerId");
CREATE INDEX "TrainingAttendance_playerId_status_idx" ON "TrainingAttendance"("playerId", "status");

CREATE TABLE "StatisticPreference" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "teamId" TEXT NOT NULL, "metricKeys" TEXT[], "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StatisticPreference_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "StatisticPreference_userId_teamId_key" ON "StatisticPreference"("userId", "teamId");

CREATE TABLE "Notification" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "type" "NotificationType" NOT NULL DEFAULT 'general', "title" TEXT NOT NULL,
  "body" TEXT NOT NULL, "link" TEXT, "readAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id"));
CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");

CREATE TABLE "AppRelease" (
  "id" TEXT NOT NULL, "version" TEXT NOT NULL, "buildNumber" INTEGER NOT NULL, "apkPath" TEXT NOT NULL, "sha256" TEXT NOT NULL,
  "notes" TEXT, "publishedById" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AppRelease_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "AppRelease_version_key" ON "AppRelease"("version");
CREATE UNIQUE INDEX "AppRelease_buildNumber_key" ON "AppRelease"("buildNumber");

ALTER TABLE "Training" ADD CONSTRAINT "Training_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Training" ADD CONSTRAINT "Training_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MatchAttendance" ADD CONSTRAINT "MatchAttendance_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MatchAttendance" ADD CONSTRAINT "MatchAttendance_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TrainingAttendance" ADD CONSTRAINT "TrainingAttendance_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "Training"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TrainingAttendance" ADD CONSTRAINT "TrainingAttendance_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StatisticPreference" ADD CONSTRAINT "StatisticPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StatisticPreference" ADD CONSTRAINT "StatisticPreference_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AppRelease" ADD CONSTRAINT "AppRelease_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
