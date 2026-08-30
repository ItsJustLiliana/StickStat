import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const route=readFileSync("app/api/admin/account-bindings/route.ts","utf8");
const form=readFileSync("components/account-binding-panel.tsx","utf8");

describe("gecombineerd account koppelen",()=>{
  it("slaat team, rollen, speler en vaste spelersnaam in één transactie op",()=>{
    expect(route).toContain("db.$transaction");
    expect(route).toContain("teamMembership.upsert");
    expect(route).toContain("name:player.displayName");
    expect(route).toContain("PLAYER_TEAM_MISMATCH");
  });

  it("biedt één formulier voor gebruiker, team, speler en rollen",()=>{
    expect(form).toContain("Geregistreerde gebruiker");
    expect(form).toContain("Spelersprofiel");
    expect(form).toContain('name="roles"');
    expect(form).toContain("Alles koppelen");
  });
});
