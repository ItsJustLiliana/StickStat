import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync("app/matches/page.tsx", "utf8");
const filters = readFileSync("components/match-filters.tsx", "utf8");
const teamLabel = readFileSync("components/match-team-label.tsx", "utf8");

describe("wedstrijdfilters", () => {
    it("biedt alle filters in een direct toegepaste popup", () => {
        expect(page).toContain("<MatchFilters");
        expect(page).not.toContain(">Filter</button>");
        expect(filters).toContain('className="match-filters"');
        expect(filters).toContain("router.replace(`/matches?");
        expect(filters).toContain("Tegenstander");
    });

    it("filtert op de tegenstander en markeert het eigen team", () => {
        expect(page).toMatch(/match\.homeTeamId\s*===\s*team\.id\s*\?\s*match\.awayTeam\.name\s*:\s*match\.homeTeam\.name/);
        expect(page).toContain("<MatchTeamLabel");
        expect(teamLabel).toContain('own?"Mijn team":"Tegenstander"');
        expect(teamLabel).toContain('aria-label={`${identity}, ${location}: ${name}`}');
        expect(teamLabel).not.toContain("<small>");
        expect(filters).toContain("closeOutside");
    });
});
