-- Kijkers volgen teams via Favoriete teams en hebben geen TeamMembership-rol.
UPDATE "TeamMembership"
SET "roles" = array_remove("roles", 'viewer'::"TeamRole")
WHERE "roles" @> ARRAY['viewer'::"TeamRole"];

DELETE FROM "TeamMembership" WHERE cardinality("roles") = 0;

ALTER TABLE "TeamMembership"
ALTER COLUMN "roles" SET DEFAULT ARRAY[]::"TeamRole"[];
