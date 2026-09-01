import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync("app/matches/page.tsx", "utf8");
const filters = readFileSync("components/match-filters.tsx", "utf8");

describe("wedstrijdfilters", () => {
    it("biedt alle filters in een direct toegepaste popup", () => {
        expect(page).toContain("<MatchFilters");
        expect(page).not.toContain(">Filter</button>");
        expect(filters).toContain('<details className="match-filters">');
        expect(filters).toContain("router.replace(`/matches?");
        expect(filters).toContain("Zoek tegenstander");
    });

    it("filtert op de tegenstander en markeert het eigen team", () => {
        expect(page).toMatch(/match\.homeTeamId\s*===\s*team\.id\s*\?\s*match\.awayTeam\.name\s*:\s*match\.homeTeam\.name/);
        expect(page).toContain('"own-team"');
        expect(page).toContain("Jouw team");
    });
});
