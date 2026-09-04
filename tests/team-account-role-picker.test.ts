import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const form = readFileSync("components/team-member-management.tsx", "utf8");
const details = readFileSync("app/team-members/[userId]/page.tsx", "utf8");
const route = readFileSync("app/api/teams/[teamId]/members/route.ts", "utf8");
const players = readFileSync("app/players/page.tsx", "utf8");

describe("teamaccount- en rollenbeheer", () => {
  it("bewerkt het gekozen teamlid zonder vrij e-mailveld", () => {
    expect(details).toContain("<TeamMemberManagement");
    expect(form).toContain("Rollen en spelerskoppeling");
    expect(form).not.toContain('name="email"');
    expect(route).toContain("userId:z.string().cuid()");
    expect(route).not.toContain("input.email");
  });

  it("laadt rollen en spelerskoppeling van het teamlid", () => {
    expect(form).toContain("useState(roles)");
    expect(form).toContain('useState(playerId??"")');
    expect(form).toContain("checked={selectedRoles.includes(role)}");
  });

  it("toont de rolsecties in de gewenste volgorde", () => {
    const order = [
      players.indexOf('role:"player"'),
      players.indexOf('role:"coach"'),
      players.indexOf('role:"trainer"'),
      players.indexOf('role:"team_admin"'),
      players.indexOf('role:"viewer"'),
    ];
    expect(order.every((index) => index >= 0)).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it("toont alle rollen als compacte lijsten en verbergt lege secties", () => {
    expect(players).toContain('<div className="roster-list"');
    expect(players).toContain("<RosterListItem person={person}");
    expect(players).toContain("if(!people.length)return null");
    expect(players).not.toContain("Nog niemand met deze rol");
  });

  it("beschermt de laatste teambeheerder", () => {
    expect(form).toContain("protectedAdmin");
    expect(form).toContain('protectedAdmin?["team_admin" as const]');
    expect(form).toContain("Wijs eerst iemand anders als teambeheerder aan");
  });

  it("houdt accounts zonder spelerskoppeling onderaan en alleen voor beheerders", () => {
    expect(route).toContain("roles:z.array(role)");
    expect(route).not.toContain("roles:z.array(role).min(1)");
    expect(players).toContain("!membership.user.player");
    expect(players).toContain("Geregistreerde accounts zonder spelersprofiel");
    expect(players).toMatch(/canAdmin\s*&&\s*unlinkedAccounts\.length\s*>\s*0/);
    expect(players.indexOf("Geregistreerde accounts zonder spelersprofiel")).toBeGreaterThan(
      players.indexOf("sections.map")
    );
  });

  it("sorteert iedere lijst op achternaam", () => {
    expect(players).toContain('new Intl.Collator("nl"');
    expect(players).toContain("sortName:player?.lastName??accountLastName");
    expect(players).toContain("sortName:player.lastName");
    expect(players).toContain("sortByLastName(people)");
    expect(players).toContain("sortByLastName(memberships.filter");
  });

  it("laat uitsluitend teambeheerders accounts en rollen wijzigen", () => {
    expect(details).toMatch(/canAdmin\s*&&/);
    expect(details).toContain("<TeamMemberManagement");
    expect(route.match(/authorizeTeamAdmin\(teamId\)/g)).toHaveLength(2);
    expect(form).toContain("Account uit team verwijderen");
  });
});
