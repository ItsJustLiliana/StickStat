import {describe,expect,it} from "vitest";
import {playerTotals} from "../lib/player-statistics";

describe("spelerstatistieken uit prestaties",()=>{
  it("telt goals en assists uit wedstrijdgebeurtenissen",()=>expect(playerTotals("scorer",[{matchId:"match-1",goals:0,assists:0,saves:0,mvp:false}],[{matchId:"match-1",type:"goal",playerId:"scorer",relatedPlayerId:"assist"},{matchId:"match-1",type:"goal",playerId:"scorer",relatedPlayerId:null}])).toMatchObject({goals:2,assists:0}));
  it("telt een assist alleen voor de aangewezen speler",()=>expect(playerTotals("assist",[],[{matchId:"match-1",type:"goal",playerId:"scorer",relatedPlayerId:"assist"}])).toMatchObject({goals:0,assists:1}));
  it("houdt oudere statistieken aan wanneer er geen prestatie is",()=>expect(playerTotals("scorer",[{matchId:"match-1",goals:3,assists:2,saves:1,mvp:true}],[])).toMatchObject({goals:3,assists:2,saves:1,mvps:1}));
});
