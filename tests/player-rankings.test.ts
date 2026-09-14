import {describe,expect,it} from "vitest";
import {playerRankingPositions,type PlayerRankingRow} from "../lib/player-rankings";

const row=(id:string,changes:Partial<PlayerRankingRow>={}):PlayerRankingRow=>({id,matches:0,starts:0,goals:0,assists:0,saves:0,mvps:0,cards:0,matchAttendance:0,trainingAttendance:0,...changes});

describe("persoonlijke posities",()=>{
  it("behoudt alle categorieën wanneer er nog geen prestaties zijn",()=>{
    const positions=playerRankingPositions([row("own")],"own");
    expect(positions.map(position=>position.label)).toEqual(["Wedstrijden","Basisplaatsen","Topscorers","Assists","G + A","Reddingen","MVP's","Kaarten","Wedstrijd aanwezig","Training aanwezig"]);
    expect(positions.every(position=>position.rank===null)).toBe(true);
  });
  it("rangschikt gelijke scores gelijk en telt alle hoger geplaatste spelers",()=>{
    const players=[row("a",{goals:4}),row("b",{goals:4}),row("own",{goals:2,assists:5})];
    expect(playerRankingPositions(players,"a").find(position=>position.label==="Topscorers")?.rank).toBe(1);
    const positions=playerRankingPositions(players,"own");
    expect(positions.find(position=>position.label==="Topscorers")?.rank).toBe(3);
    expect(positions.find(position=>position.label==="G + A")?.rank).toBe(1);
  });
});
