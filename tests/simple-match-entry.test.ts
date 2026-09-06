import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const form = readFileSync("components/match-team-stats-form.tsx", "utf8");
const route = readFileSync("app/api/matches/[matchId]/team-stats/route.ts", "utf8");

describe("eenvoudige wedstrijdinvoer", () => {
  it("biedt gebeurtenisgestuurde invoer voor prestaties", () => {
    for (const label of ["Goal", "Assist", "Redding", "Groene kaart", "Gele kaart", "Rode kaart", "Man of the Match", "Notitie"]) expect(form).toContain(label);
    expect(form).toContain("Kies een gebeurtenis");
  });

  it("is vooraf invulbaar voor teambeheerders en bewaakt de teamscore", () => {
    expect(route).not.toContain("MATCH_NOT_STARTED");
    expect(route).toContain("TOO_MANY_GOALS");
    expect(route).toContain("MULTIPLE_MVPS");
    expect(route).toContain("PLAYER_TEAM_MISMATCH");
    expect(route).toContain("authorizeTeamManagement");
  });

  it("toont standaard de registratie en opent invoer pas via het potlood", () => {
    expect(form).toContain("Geregistreerde gegevens van deze wedstrijd");
    expect(form).toContain("Wedstrijdstatistieken aanpassen");
    expect(form).toContain("Pencil");
    expect(form).toContain("if(!editing)");
  });
});
