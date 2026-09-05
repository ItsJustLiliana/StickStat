import {z} from "zod";

// Outfield lines from defence to attack; the goalkeeper is separate.
export const formations = {
  "4-3-3": [4, 3, 3],
  "3-4-3": [3, 4, 3],
  "3-3-4": [3, 3, 4],
  "4-4-2": [4, 4, 2],
  "4-2-3-1": [4, 2, 3, 1],
} as const;
export type Formation = keyof typeof formations;
export const lineupSchema = z.object({
  teamId: z.string().cuid(),
  formation: z.enum(["4-3-3", "3-4-3", "3-3-4", "4-4-2", "4-2-3-1"]),
  positions: z.array(z.string().cuid().nullable()).length(11),
}).refine(input => {const ids = input.positions.filter(Boolean); return new Set(ids).size === ids.length;}, {message: "Een speler kan maar op één positie staan", path: ["positions"]});

export function fieldPositions(formation: Formation) {
  const lines = formations[formation];
  return [{x: 50, y: 90, label: "Keeper"}, ...lines.flatMap((count, line) => Array.from({length: count}, (_, i) => ({
    x: 100 * (i + 1) / (count + 1), y: 72 - line * (58 / (lines.length - 1)),
    label: `${line === 0 ? "Verdediging" : line === lines.length - 1 ? "Aanval" : lines.length === 4 ? (line === 1 ? "Controlerend middenveld" : "Aanvallend middenveld") : "Middenveld"} ${i + 1}`,
  })))];
}
