import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const list=readFileSync("app/players/page.tsx","utf8");
const details=readFileSync("app/team-members/[userId]/page.tsx","utf8");

describe("teamliddetails",()=>{
  it("maakt ieder gekoppeld account klikbaar",()=>{
    expect(list).toContain("/team-members/${membership.userId}?team=${team.id}");
  });

  it("toont spelersgegevens alleen bij de spelersrol",()=>{
    expect(details).toContain('membership.roles.includes("player")');
    expect(details).toContain("Rugnummer");
    expect(details).toContain("Positie");
    expect(details).toContain("Goals");
    expect(details).toContain("Dit account heeft geen spelersrol");
  });

  it("beperkt de detailpagina tot het gekozen teamlidmaatschap",()=>{
    expect(details).toContain("userId_teamId:{userId,teamId:team.id}");
    expect(details).toContain("if(!membership)notFound()");
  });
});
