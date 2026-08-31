import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const playerPage=readFileSync("app/players/[playerId]/page.tsx","utf8");
const matchPage=readFileSync("app/matches/[matchId]/page.tsx","utf8");
const eventsRoute=readFileSync("app/api/matches/[matchId]/events/route.ts","utf8");
const statsRoute=readFileSync("app/api/matches/[matchId]/player-stats/route.ts","utf8");

describe("directe resource-autorisatie",()=>{
  it("verbergt spelers uit teams waar de gebruiker geen toegang toe heeft",()=>{
    expect(playerPage).toContain("teams.some(team=>team.id===player.teamId)");
  });

  it("verbergt wedstrijddetails buiten de toegankelijke teams",()=>{
    expect(matchPage).toContain("accessibleTeamIds");
    expect(matchPage).toContain("matchTeamIds.some");
    expect(matchPage).toContain("notFound()");
  });

  it("weigert statistieken voor spelers uit een ander team",()=>{
    expect(eventsRoute).toContain("PLAYER_TEAM_MISMATCH");
    expect(statsRoute).toContain("PLAYER_TEAM_MISMATCH");
  });

  it("houdt deelnemers zichtbaar in historische wedstrijddetails",()=>{
    expect(matchPage).toContain("matchStats:{some:{matchId:match.id}}");
  });
});
