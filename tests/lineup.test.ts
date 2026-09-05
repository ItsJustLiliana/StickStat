import {describe, expect, it} from "vitest";
import {fieldPositions, formations, lineupSchema, type Formation} from "../lib/lineup";

const teamId = "cm00000000000000000000001", playerId = "cm00000000000000000000002";
describe("wedstrijdopstelling", () => {
  it.each(Object.keys(formations) as Formation[])("plaatst elf unieke posities binnen het veld voor %s", formation => {
    const positions = fieldPositions(formation);
    expect(positions).toHaveLength(11);
    expect(positions[0].label).toBe("Keeper");
    expect(new Set(positions.map(({x, y}) => `${x},${y}`)).size).toBe(11);
    expect(positions.every(({x, y}) => x > 0 && x < 100 && y > 0 && y < 100)).toBe(true);
  });
  it("bewaart een gedeeltelijke opstelling maar weigert dubbele spelers en ongeldige formaties", () => {
    const input = {teamId, formation: "4-3-3", positions: [playerId, ...Array(10).fill(null)]};
    expect(lineupSchema.safeParse(input).success).toBe(true);
    expect(lineupSchema.safeParse({...input, positions: Array(11).fill(playerId)}).success).toBe(false);
    expect(lineupSchema.safeParse({...input, positions: Array(12).fill(null)}).success).toBe(false);
    expect(lineupSchema.safeParse({...input, formation: "4-4-4"}).success).toBe(false);
  });
});
