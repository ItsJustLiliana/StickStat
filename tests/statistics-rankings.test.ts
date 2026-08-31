import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const page=readFileSync("app/statistics/page.tsx","utf8");
const api=readFileSync("app/api/teams/[teamId]/stats/route.ts","utf8");

describe("spelersranglijsten",()=>{
  it("toont de vier simpele ranglijsten",()=>{
    expect(page).toContain('title="Topscorers"');
    expect(page).toContain('title="Meeste assists"');
    expect(page).toContain('title="Meeste MVP\'s"');
    expect(page).toContain('title="Meeste kaarten"');
  });

  it("telt alleen afgeronde wedstrijden van het gekozen team",()=>{
    expect(page.match(/status:"finished"/g)?.length).toBeGreaterThanOrEqual(3);
    expect(api).toContain('status:"finished" as const');
    expect(api).toContain("matchStats:{where:{match:matchFilter}}");
    expect(api).toContain("events:{where:{match:matchFilter}}");
  });

  it("behoudt de teamselectie in links en beperkt grafieken tot tien spelers",()=>{
    expect(page).toContain("?team=${teamId}");
    expect(page).toContain(".slice(0,10)");
  });
});
