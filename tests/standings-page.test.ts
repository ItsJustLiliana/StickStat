import React from "react";
import {beforeEach,describe,expect,it,vi} from "vitest";

const {db,user}=vi.hoisted(()=>({
  db:{team:{findMany:vi.fn(),findUnique:vi.fn()},player:{findUnique:vi.fn()},standing:{findFirst:vi.fn(),findMany:vi.fn()},match:{findMany:vi.fn()}},
  user:{id:"user",platformRole:"player",teamMemberships:[{teamId:"rapide",createdAt:new Date(0)}]},
}));
vi.mock("@/lib/db",()=>({db}));
vi.mock("@/lib/auth",()=>({currentUser:async()=>user}));
vi.mock("@/components/page-shell",()=>({PageShell:()=>null}));
vi.mock("@/components/standings-view",()=>({StandingsView:()=>null}));
vi.mock("@/components/join-team-button",()=>({JoinTeamButton:()=>null}));
import Standings from "../app/standings/page";

describe("standpagina",()=>{
  beforeEach(()=>{
    vi.resetAllMocks();
    vi.stubGlobal("React",React);
    db.team.findMany.mockResolvedValue([{id:"alphabetical"},{id:"rapide"}]);
    db.player.findUnique.mockResolvedValue(null);
    db.standing.findFirst.mockResolvedValue(null);
    db.match.findMany.mockResolvedValue([]);
  });
  it("kiest het eigen team boven een alfabetisch eerder favoriet",async()=>{
    await Standings({searchParams:Promise.resolve({})});
    expect(db.standing.findFirst).toHaveBeenCalledWith(expect.objectContaining({where:{teamId:"rapide"}}));
  });
  it("haalt eigen scores ook zonder stand op",async()=>{
    await Standings({searchParams:Promise.resolve({})});
    expect(db.match.findMany).toHaveBeenCalledWith(expect.objectContaining({where:{seasonId:undefined,status:"finished",OR:[{homeTeamId:{in:["rapide"]}},{awayTeamId:{in:["rapide"]}}]}}));
  });
  it("respecteert een rechtstreeks geopende teampagina",async()=>{
    db.team.findUnique.mockResolvedValue({id:"other"});
    await Standings({searchParams:Promise.resolve({team:"other"})});
    expect(db.standing.findFirst).toHaveBeenCalledWith(expect.objectContaining({where:{teamId:"other"}}));
  });
});
