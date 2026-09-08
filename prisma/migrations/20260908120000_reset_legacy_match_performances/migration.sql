-- Replace the old per-player aggregate performance data with discrete events.
-- Keep attendance, line-up substitutions, fixtures, results and photos intact.
DELETE FROM "PlayerMatchStats";

DELETE FROM "MatchEvent"
WHERE "type" IN (
  'goal',
  'assist',
  'save',
  'green_card',
  'yellow_card',
  'red_card',
  'penalty_corner',
  'penalty_stroke',
  'custom'
);
