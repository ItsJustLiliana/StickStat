import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const list=readFileSync("app/players/page.tsx","utf8");
const details=readFileSync("app/team-members/[userId]/page.tsx","utf8");
const playerDetails=readFileSync("app/players/[playerId]/page.tsx","utf8");
const roster=readFileSync("components/roster-card.tsx","utf8");

describe("teamliddetails",()=>{
  it("maakt ieder gekoppeld account klikbaar",()=>{
    expect(list).toContain("/team-members/${membership.userId}?team=${team.id}");
  });

  it("toont spelersgegevens alleen bij de spelersrol",()=>{
    expect(details).toContain('membership.roles.includes("player")');
    expect(details).toContain("Rugnummer");
    expect(details).toContain("Positie");
    expect(details).toContain("Goals");
    expect(details).toContain("Dit account heeft geen gekoppeld spelersprofiel");
  });

  it("verbergt ontbrekend rugnummer en ontbrekende positie",()=>{
    expect(playerDetails).not.toContain("Positie onbekend");
    expect(playerDetails).toContain("playerDetails.length>0");
    expect(details).toContain("player.shirtNumber!==null&&");
    expect(details).toContain("player.position&&");
    expect(roster).toContain("person.shirtNumber!=null&&");
    expect(roster).toContain("person.subtitle&&");
  });

  it("beperkt de detailpagina tot het gekozen teamlidmaatschap",()=>{
    expect(details).toContain("userId_teamId:{userId,teamId:team.id}");
    expect(details).toContain("if(!membership)notFound()");
  });
});
