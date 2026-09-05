import { z } from "zod";

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
}).refine(input => { const ids = input.positions.filter(Boolean); return new Set(ids).size === ids.length; }, { message: "Een speler kan maar op één positie staan", path: ["positions"] });

type LineRole = "defense" | "midfield" | "holding-midfield" | "attacking-midfield" | "attack";

const roleLabels: Record<LineRole, string> = {
  defense: "Verdediging",
  midfield: "Middenveld",
  "holding-midfield": "Controlerend middenveld",
  "attacking-midfield": "Aanvallend middenveld",
  attack: "Aanval",
};

const namedPositions: Record<LineRole, Partial<Record<number, string[]>>> = {
  defense: {
    1: ["Centrale verdediger"],
    2: ["Rechtsachter", "Linksachter"],
    3: ["Rechtsachter", "Centrale verdediger", "Linksachter"],
    4: ["Rechtsachter", "Rechter centrumverdediger", "Linker centrumverdediger", "Linksachter"],
  },
  midfield: {
    1: ["Centrale middenvelder"],
    2: ["Rechter middenvelder", "Linker middenvelder"],
    3: ["Rechthalf", "Centrale middenvelder", "Linkshalf"],
    4: ["Rechtsmidden", "Rechter centrale middenvelder", "Linker centrale middenvelder", "Linksmidden"],
  },
  "holding-midfield": {
    1: ["Controlerende middenvelder"],
    2: ["Rechter controleur", "Linker controleur"],
    3: ["Rechter controleur", "Centrale controleur", "Linker controleur"],
  },
  "attacking-midfield": {
    1: ["Aanvallende middenvelder"],
    2: ["Rechter aanvallende middenvelder", "Linker aanvallende middenvelder"],
    3: ["Rechter aanvallende middenvelder", "Centrale aanvallende middenvelder", "Linker aanvallende middenvelder"],
  },
  attack: {
    1: ["Spits"],
    2: ["Rechter spits", "Linker spits"],
    3: ["Rechtsvoor", "Spits", "Linksvoor"],
    4: ["Rechtsbuiten", "Rechter spits", "Linker spits", "Linksbuiten"],
  },
};

function roleForLine(line: number, totalLines: number): LineRole {
  if (line === 0) return "defense";
  if (line === totalLines - 1) return "attack";
  if (totalLines === 4) return line === 1 ? "holding-midfield" : "attacking-midfield";
  return "midfield";
}

function positionLabel(role: LineRole, count: number, index: number) {
  const roleNames = namedPositions[role][count];
  if (roleNames?.[index]) return roleNames[index];
  return `${roleLabels[role]} ${index + 1}`;
}

export function fieldPositions(formation: Formation) {
  const lines = formations[formation];
  return [{ x: 50, y: 90, label: "Keeper" }, ...lines.flatMap((count, line) => Array.from({ length: count }, (_, i) => ({
    x: 100 * (i + 1) / (count + 1), y: 72 - line * (58 / (lines.length - 1)),
    label: positionLabel(roleForLine(line, lines.length), count, i),
  })))];
}
