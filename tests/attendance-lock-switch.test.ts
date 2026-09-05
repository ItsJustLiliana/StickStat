import {beforeEach, describe, expect, it, vi} from "vitest";
import {HttpError} from "../lib/api";
const mocks = vi.hoisted(() => ({authorize: vi.fn(), save: vi.fn()}));
vi.mock("@/lib/auth", () => ({authorizeTeamAdmin: mocks.authorize}));
vi.mock("@/lib/db", () => ({db: {
  training: {findUnique: async () => ({teamId: "cm00000000000000000000001"}), update: mocks.save},
  match: {findUnique: async () => ({homeTeamId: "cm00000000000000000000001", awayTeamId: "cm00000000000000000000002"})},
  matchTeamPlan: {upsert: mocks.save},
}}));
import {PUT as training} from "../app/api/trainings/[trainingId]/attendance-lock/route";
import {PUT as match} from "../app/api/matches/[matchId]/attendance-lock/route";
const teamId = "cm00000000000000000000001";
const request = (body: unknown) => new Request("http://localhost/api/lock", {method: "PUT", body: JSON.stringify(body)});
const handlers = [
  {name: "training", run: (body: unknown) => training(request(body), {params: Promise.resolve({trainingId: "training"})})},
  {name: "wedstrijd", run: (body: unknown) => match(request(body), {params: Promise.resolve({matchId: "match"})})},
];
beforeEach(() => {vi.resetAllMocks(); mocks.save.mockResolvedValue({attendanceLocked: true});});
describe.each(handlers)("aanmeldswitch $name", ({run}) => {
  it.each([true, false])("bewaart vergrendeling %s na controle van teambeheerrechten", async locked => {
    expect((await run({teamId, locked})).status).toBe(200);
    expect(mocks.authorize).toHaveBeenCalledWith(teamId);
    expect(mocks.save).toHaveBeenCalledOnce();
  });
  it("weigert een gebruiker zonder teambeheerrechten", async () => {
    mocks.authorize.mockRejectedValue(new HttpError(403, "FORBIDDEN", "Geen toegang"));
    expect((await run({teamId, locked: true})).status).toBe(403);
    expect(mocks.save).not.toHaveBeenCalled();
  });
  it("weigert een ander team", async () => {
    expect((await run({teamId: "cm00000000000000000000009", locked: true})).status).toBe(404);
    expect(mocks.save).not.toHaveBeenCalled();
  });
});
