import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const standings=readFileSync("app/standings/page.tsx","utf8");
const standingsView=readFileSync("components/standings-view.tsx","utf8");
const matches=readFileSync("app/matches/page.tsx","utf8");

describe("vereenvoudigde overzichten",()=>{
  it("toont geen clublogo's in de stand",()=>{
    expect(standings).not.toContain("ClubLogo");
    expect(standings).not.toContain("logoLocalPath");
    expect(standings).toContain("teamName:row.team.name");
    expect(standings).toContain("StandingsView");
    expect(standingsView).toContain('useState(false)');
    expect(standingsView).toContain('role="switch"');
    expect(standingsView).toContain('className="team-name"');
  });

  it("laat competitie en status weg uit de wedstrijdtabel",()=>{
    expect(matches).not.toContain("<th>Competitie</th>");
    expect(matches).not.toContain("<th>Status</th>");
    expect(matches).not.toContain("match.competition");
    expect(matches).not.toContain("match.status");
  });

  it("sorteert wedstrijden van vroeg naar laat",()=>{
    expect(matches).toMatch(/orderBy:\s*\[\s*\{\s*date:\s*"asc"\s*\},\s*\{\s*startTime:\s*"asc"\s*\}\s*\]/);
  });
});
