import {beforeEach, describe, expect, it, vi} from "vitest";
import {HttpError} from "../lib/api";

const mocks = vi.hoisted(() => ({authorize: vi.fn(), count: vi.fn(), save: vi.fn()}));
vi.mock("@/lib/auth", () => ({authorizeTeamManagement: mocks.authorize}));
vi.mock("@/lib/db", () => ({db: {
  match: {findUnique: async () => ({homeTeamId: "cm00000000000000000000001", awayTeamId: "cm00000000000000000000002"})},
  player: {count: mocks.count}, matchTeamPlan: {upsert: mocks.save},
}}));
import {PUT} from "../app/api/matches/[matchId]/lineup/route";
const teamId = "cm00000000000000000000001", playerId = "cm00000000000000000000003";
const input = {teamId, formation: "4-3-3", positions: [playerId, ...Array(10).fill(null)]};
const run = (body = input) => PUT(new Request("http://localhost/api/lineup", {method: "PUT", body: JSON.stringify(body)}), {params: Promise.resolve({matchId: "match"})});

beforeEach(() => {vi.resetAllMocks(); mocks.count.mockResolvedValue(1); mocks.save.mockResolvedValue(input);});
describe("opstelling API", () => {
  it("controleert coachrechten en bewaart een gedeeltelijke opstelling zonder het slot te overschrijven", async () => {
    expect((await run()).status).toBe(200);
    expect(mocks.authorize).toHaveBeenCalledWith(teamId);
    expect(mocks.count).toHaveBeenCalledWith({where: {id: {in: [playerId]}, teamId, active: true, matchMember: true}});
    expect(mocks.save.mock.calls[0][0].update).toEqual({formation: input.formation, positions: input.positions});
  });
  it("weigert gebruikers zonder beheerrechten", async () => {
    mocks.authorize.mockRejectedValue(new HttpError(403, "FORBIDDEN", "Geen toegang"));
    expect((await run()).status).toBe(403);
    expect(mocks.save).not.toHaveBeenCalled();
  });
  it("weigert een team dat niet aan de wedstrijd deelneemt", async () => {
    expect((await run({...input, teamId: "cm00000000000000000000009"})).status).toBe(404);
    expect(mocks.save).not.toHaveBeenCalled();
  });
  it("weigert inactieve spelers en spelers buiten de wedstrijdselectie", async () => {
    mocks.count.mockResolvedValue(0);
    expect((await run()).status).toBe(400);
    expect(mocks.save).not.toHaveBeenCalled();
  });
  it("weigert dubbele spelers voordat er wordt opgeslagen", async () => {
    expect((await run({...input, positions: Array(11).fill(playerId)})).status).toBe(400);
    expect(mocks.save).not.toHaveBeenCalled();
  });
});
