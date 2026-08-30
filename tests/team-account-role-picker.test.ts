import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const form=readFileSync("components/team-management-panel.tsx","utf8");
const route=readFileSync("app/api/teams/[teamId]/members/route.ts","utf8");
const players=readFileSync("app/players/page.tsx","utf8");

describe("teamaccount- en rollenbeheer",()=>{
  it("kiest een geregistreerd account en gebruikt geen vrij e-mailveld",()=>{
    expect(form).toContain("Geregistreerd account");
    expect(form).toContain("selectAccount");
    expect(form).not.toContain('name="email"');
    expect(route).toContain("userId:z.string().cuid()");
    expect(route).not.toContain("input.email");
  });

  it("laadt rollen en spelerskoppeling van het gekozen account",()=>{
    expect(form).toContain("account?.roles??[]");
    expect(form).toContain("account?.playerId");
    expect(form).toContain("checked={selectedRoles.includes(value)}");
  });

  it("toont de rolsecties in de gewenste volgorde",()=>{
    const order=[players.indexOf('role:"player"'),players.indexOf('role:"coach"'),players.indexOf('role:"trainer"'),players.indexOf('role:"team_admin"'),players.indexOf('role:"viewer"')];
    expect(order.every(index=>index>=0)).toBe(true);
    expect(order).toEqual([...order].sort((a,b)=>a-b));
  });

  it("toont alle rollen als compacte lijsten",()=>{
    expect(players).toContain('<div className="roster-list"');
    expect(players).toContain("<RosterListItem person={person}");
    expect(players).not.toContain("<RosterCard person={person}");
  });

  it("verbergt een rolsectie zonder leden",()=>{
    expect(players).toContain("if(!people.length)return null");
    expect(players).not.toContain("Nog niemand met deze rol");
  });

  it("houdt de rol van de laatste teambeheerder vast in het formulier",()=>{
    expect(form).toContain("protectedAdminUserId");
    expect(form).toContain('new Set<Role>([...selectedRoles,"team_admin"])');
    expect(form).toContain("Wijs eerst een tweede teambeheerder aan");
  });

  it("houdt accounts zonder rol onderaan als niet ingedeeld",()=>{
    expect(route).toContain("roles:z.array(role)");
    expect(route).not.toContain("roles:z.array(role).min(1)");
    expect(form).toContain("Nog niet ingedeeld");
    expect(players).toContain("!membership.roles.length");
    expect(players).toContain("Accounts zonder toegewezen rol");
    expect(players.indexOf("Accounts zonder toegewezen rol")).toBeGreaterThan(players.indexOf("sections.map"));
  });
});
