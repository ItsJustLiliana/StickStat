import {describe,expect,it} from "vitest";
import {playerTotals,playerMatchPerformances} from "../lib/player-statistics";

describe("spelerstatistieken uit prestaties",()=>{
  it("telt een MVP uit gebeurtenissen en oude statistieken maar één keer",()=>{
    expect(playerTotals("own",[{matchId:"m",goals:0,assists:0,saves:0,mvp:true}],[{matchId:"m",type:"mvp",playerId:"own",relatedPlayerId:null}]).mvps).toBe(1);
  });
  it("berekent persoonlijke duelprestaties ook zonder oude statistiekrij",()=>{
    const match={date:new Date("2026-09-13")};
    const events=[{matchId:"m",match,type:"goal",playerId:"scorer",relatedPlayerId:"own"},{matchId:"m",match,type:"goal",playerId:"scorer",relatedPlayerId:"own"}];
    expect(playerMatchPerformances("own",[],events)).toEqual([{matchId:"m",match,goals:0,assists:2,saves:0,mvps:0}]);
  });
  it("telt goals en assists uit wedstrijdgebeurtenissen",()=>expect(playerTotals("scorer",[{matchId:"match-1",goals:0,assists:0,saves:0,mvp:false}],[{matchId:"match-1",type:"goal",playerId:"scorer",relatedPlayerId:"assist"},{matchId:"match-1",type:"goal",playerId:"scorer",relatedPlayerId:null}])).toMatchObject({goals:2,assists:0}));
  it("telt een assist alleen voor de aangewezen speler",()=>expect(playerTotals("assist",[],[{matchId:"match-1",type:"goal",playerId:"scorer",relatedPlayerId:"assist"}])).toMatchObject({goals:0,assists:1}));
  it("houdt oudere statistieken aan wanneer er geen prestatie is",()=>expect(playerTotals("scorer",[{matchId:"match-1",goals:3,assists:2,saves:1,mvp:true}],[])).toMatchObject({goals:3,assists:2,saves:1,mvps:1}));
});
