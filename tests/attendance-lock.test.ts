import {beforeEach, describe, expect, it, vi} from "vitest";

const mocks = vi.hoisted(() => ({
  user: {id: "self", platformRole: "user", teamMemberships: [{teamId: "team", roles: ["player"]}]},
  locked: true,
  save: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({requireUser: async () => mocks.user}));
vi.mock("@/lib/db", () => ({db: {
  training: {findUnique: async () => ({teamId: "team", attendanceLocked: mocks.locked})},
  match: {findUnique: async () => ({homeTeamId: "team", awayTeamId: "opponent"})},
  player: {findUnique: async () => ({teamId: "team", userId: "self"})},
  matchTeamPlan: {findUnique: async () => ({attendanceLocked: mocks.locked})},
  trainingAttendance: {upsert: mocks.save}, matchAttendance: {upsert: mocks.save},
}}));
import {PUT as training} from "../app/api/trainings/[trainingId]/attendance/route";
import {PUT as match} from "../app/api/matches/[matchId]/attendance/route";

const request = () => new Request("http://localhost/api/attendance", {method: "PUT", headers: {"content-type": "application/json"}, body: JSON.stringify({playerId: "cm00000000000000000000001", status: "present"})});
const handlers = [
  {name: "training", run: () => training(request(), {params: Promise.resolve({trainingId: "training"})})},
  {name: "wedstrijd", run: () => match(request(), {params: Promise.resolve({matchId: "match"})})},
];
beforeEach(() => {mocks.locked = true; mocks.user.id = "self"; mocks.user.teamMemberships = [{teamId: "team", roles: ["player"]}]; mocks.save.mockReset(); mocks.save.mockResolvedValue({status: "present"});});
describe.each(handlers)("aanmeldingen $name", ({run}) => {
  it.each(["player", "coach", "trainer"])("weigert wijzigen bij vergrendeling voor %s", async role => {
    mocks.user.teamMemberships[0].roles = [role];
    expect((await run()).status).toBe(403);
    expect(mocks.save).not.toHaveBeenCalled();
  });
  it("laat de teambeheerder ook na vergrendeling wijzigen", async () => {
    mocks.user.id = "manager"; mocks.user.teamMemberships[0].roles = ["team_admin"];
    expect((await run()).status).toBe(200);
    expect(mocks.save).toHaveBeenCalledOnce();
  });
  it("geeft een beheerder van het andere team geen uitzondering", async () => {
    mocks.user.teamMemberships = [{teamId: "opponent", roles: ["team_admin"]}];
    expect((await run()).status).toBe(403);
    expect(mocks.save).not.toHaveBeenCalled();
  });
  it("laat spelers bij open aanmeldingen hun eigen status wijzigen", async () => {
    mocks.locked = false;
    expect((await run()).status).toBe(200);
  });
  it("weigert bij open aanmeldingen het wijzigen van een andere speler", async () => {
    mocks.locked = false; mocks.user.id = "someone-else";
    expect((await run()).status).toBe(403);
    expect(mocks.save).not.toHaveBeenCalled();
  });
});
