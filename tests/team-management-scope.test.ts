import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const legacy=readFileSync("app/team/manage/page.tsx","utf8");
const nav=readFileSync("components/app-nav.tsx","utf8");
const players=readFileSync("app/players/page.tsx","utf8");
const details=readFileSync("app/team-members/[userId]/page.tsx","utf8");
const settings=readFileSync("components/team-settings-control.tsx","utf8");

describe("centraal teamledenbeheer",()=>{
  it("verwijdert Teambeheer uit desktop- en mobiele navigatie",()=>{
    expect(nav).not.toContain("/team/manage");
    expect(nav).not.toContain("Teambeheer");
  });

  it("stuurt oude beheerlinks door met behoud van teamkeuze",()=>{
    expect(legacy).toContain("/players?team=${encodeURIComponent(team)}");
    expect(legacy).toContain("redirect(team?");
  });

  it("plaatst instellingen op Teamleden en rollen op het teamlidprofiel",()=>{
    expect(players).toContain("<TeamSettingsControl");
    expect(settings).not.toContain("ClubLogoEditor");
    expect(settings).toContain("<TeamInvitePanel");
    expect(details).toContain("<TeamMemberManagement");
  });
});
