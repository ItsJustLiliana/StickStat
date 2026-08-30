import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const adminLink=readFileSync("app/api/admin/player-links/route.ts","utf8");
const teamLink=readFileSync("app/api/teams/[teamId]/player-links/route.ts","utf8");
const profile=readFileSync("app/api/profile/route.ts","utf8");
const migration=readFileSync("prisma/migrations/20260830210000_multiple_team_roles/migration.sql","utf8");

describe("account- en spelerskoppeling",()=>{
  it("neemt bij beide koppelroutes de spelersnaam over op het account",()=>{
    expect(adminLink).toContain("name:player.displayName");
    expect(teamLink).toContain("name:player.displayName");
  });

  it("houdt de spelersnaam leidend bij profielupdates",()=>{
    expect(profile).toContain("player?.displayName??input.name");
  });

  it("behoudt bestaande rollen tijdens de migratie",()=>{
    expect(migration).toContain('SET "roles" = ARRAY["role"]');
    expect(migration.indexOf('SET "roles"')).toBeLessThan(migration.indexOf('DROP COLUMN "role"'));
  });
});
