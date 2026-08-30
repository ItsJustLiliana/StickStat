ALTER TYPE "TeamRole" ADD VALUE IF NOT EXISTS 'trainer';

ALTER TABLE "TeamMembership"
ADD COLUMN "roles" "TeamRole"[] NOT NULL DEFAULT ARRAY['viewer'::"TeamRole"];

UPDATE "TeamMembership"
SET "roles" = ARRAY["role"]::"TeamRole"[];

ALTER TABLE "TeamMembership" DROP COLUMN "role";
