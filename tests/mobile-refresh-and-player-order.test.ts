import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

describe("mobiele refresh en spelersvolgorde",()=>{
  it("ververst met een eigen pull-gesture en houdt navigatie vast",()=>{
    const refresh=readFileSync("components/pull-to-refresh.tsx","utf8"),shell=readFileSync("components/page-shell.tsx","utf8"),css=readFileSync("app/globals.css","utf8");
    expect(shell).toContain("<PullToRefresh/>");
    expect(refresh).toContain('window.location.reload()');
    expect(refresh).toContain('event.preventDefault()');
    expect(css).toMatch(/\.topbar\s*\{[\s\S]*?position:\s*fixed/);
    expect(css).toMatch(/\.mobile-nav\s*\{[\s\S]*?position:\s*fixed/);
    expect(css).toContain("overscroll-behavior-y: none");
  });

  it("sorteert operationele spelerslijsten primair op achternaam",()=>{
    const files=["app/matches/[matchId]/page.tsx","app/trainings/[trainingId]/page.tsx","app/statistics/page.tsx","app/api/teams/[teamId]/stats/route.ts","app/api/teams/[teamId]/players/route.ts","app/admin/page.tsx"];
    for(const file of files)expect(readFileSync(file,"utf8"),file).toContain('lastName:"asc"');
  });
});
