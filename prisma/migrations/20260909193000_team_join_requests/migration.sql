CREATE TYPE "TeamJoinRequestStatus" AS ENUM ('pending', 'approved', 'declined');

CREATE TABLE "TeamJoinRequest" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "status" "TeamJoinRequestStatus" NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TeamJoinRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TeamJoinRequest_userId_teamId_key" ON "TeamJoinRequest"("userId", "teamId");
CREATE INDEX "TeamJoinRequest_teamId_status_createdAt_idx" ON "TeamJoinRequest"("teamId", "status", "createdAt");

ALTER TABLE "TeamJoinRequest" ADD CONSTRAINT "TeamJoinRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeamJoinRequest" ADD CONSTRAINT "TeamJoinRequest_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
