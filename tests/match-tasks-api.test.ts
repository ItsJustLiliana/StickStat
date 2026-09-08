import {beforeEach, describe, expect, it, vi} from "vitest";
import {HttpError} from "../lib/api";

const mocks = vi.hoisted(() => ({authorize: vi.fn(), player: vi.fn(), create: vi.fn(), remove: vi.fn()}));
vi.mock("@/lib/auth", () => ({authorizeTeamAdmin: mocks.authorize}));
vi.mock("@/lib/db", () => ({db: {
  match: {findUnique: vi.fn(async () => ({homeTeamId: "cm00000000000000000000001", awayTeamId: "cm00000000000000000000002"}))},
  player: {findFirst: mocks.player},
  matchTask: {create: mocks.create, deleteMany: mocks.remove},
}}));

import {DELETE, POST} from "../app/api/matches/[matchId]/tasks/route";

const teamId = "cm00000000000000000000001", playerId = "cm00000000000000000000003", taskId = "cm00000000000000000000004";
const params = {params: Promise.resolve({matchId: "match"})};
const post = () => POST(new Request("http://localhost/api/tasks", {method: "POST", body: JSON.stringify({teamId, playerId, taskType: "driving"})}), params);

beforeEach(() => {
  vi.resetAllMocks();
  mocks.player.mockResolvedValue({id: playerId});
  mocks.create.mockResolvedValue({id: taskId});
  mocks.remove.mockResolvedValue({count: 1});
});

describe("wedstrijdtaken API", () => {
  it("laat alleen teambeheerders een taak voor een eigen speler toevoegen", async () => {
    expect((await post()).status).toBe(200);
    expect(mocks.authorize).toHaveBeenCalledWith(teamId);
    expect(mocks.player).toHaveBeenCalledWith({where: {id: playerId, teamId}, select: {id: true}});
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({data: {matchId: "match", teamId, playerId, taskType: "driving"}}));
  });
  it("weigert een speler van een ander team", async () => {
    mocks.player.mockResolvedValue(null);
    expect((await post()).status).toBe(400);
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("weigert gebruikers zonder teambeheerrechten", async () => {
    mocks.authorize.mockRejectedValue(new HttpError(403, "FORBIDDEN", "Geen toegang"));
    expect((await post()).status).toBe(403);
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("verwijdert uitsluitend de gevraagde taak van het geselecteerde team", async () => {
    const response = await DELETE(new Request("http://localhost/api/tasks", {method: "DELETE", body: JSON.stringify({teamId, taskId})}), params);
    expect(response.status).toBe(200);
    expect(mocks.remove).toHaveBeenCalledWith({where: {id: taskId, matchId: "match", teamId}});
  });
});
