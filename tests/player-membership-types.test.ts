import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const schema=readFileSync("prisma/schema.prisma","utf8");
const migration=readFileSync("prisma/migrations/20260831210000_player_membership_types/migration.sql","utf8");
const list=readFileSync("app/players/page.tsx","utf8");
const roster=readFileSync("components/roster-card.tsx","utf8");
const match=readFileSync("app/matches/[matchId]/page.tsx","utf8");

describe("trainings- en wedstrijdleden",()=>{
  it("maakt bestaande en nieuwe spelers standaard beide",()=>{
    expect(schema).toContain("trainingMember Boolean @default(true)");
    expect(schema).toContain("matchMember Boolean @default(true)");
    expect(migration.match(/DEFAULT true/g)).toHaveLength(2);
  });

  it("toont alleen een subtiel label als een speler beperkt is",()=>{
    expect(list).toContain('return player.trainingMember&&!player.matchMember?"Training":player.matchMember&&!player.trainingMember?"Wedstrijd":undefined');
    expect(roster).toContain("roster-membership-hint");
  });

  it("verbergt ongekoppelde accounts voor gewone teamleden",()=>{
    expect(list).toContain("canAdmin&&unlinkedAccounts.length>0");
  });

  it("neemt trainingsleden niet standaard op in wedstrijdinvoer",()=>{
    expect(match).toContain("{active:true,matchMember:true}");
    expect(match).toContain("matchStats:{some:{matchId:match.id}}");
  });
});
