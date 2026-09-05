import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const form = readFileSync("components/match-team-stats-form.tsx", "utf8");
const route = readFileSync("app/api/matches/[matchId]/team-stats/route.ts", "utf8");

describe("eenvoudige wedstrijdinvoer", () => {
  it("beperkt het formulier tot deelname, goals, kaarten, MVP en notitie", () => {
    for (const label of ["Niet meegedaan", "Wissel", "Basis", "Goals", "Groen", "Geel", "Rood", "MVP", "Korte notitie"]) expect(form).toContain(label);
    for (const omitted of ["Assists", "Minuten", "Saves", "Tijdlijn"]) expect(form).not.toContain(omitted);
  });

  it("is beschikbaar vanaf het begin van de wedstrijd en bewaakt de teamscore", () => {
    expect(route).toContain('!["live","finished"].includes(match.status)');
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
