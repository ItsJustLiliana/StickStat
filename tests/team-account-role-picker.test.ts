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
    expect(form).toContain("account?.roles.length");
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
});
