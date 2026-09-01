import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const toggle = readFileSync("components/theme-toggle.tsx", "utf8");
const nav = readFileSync("components/app-nav.tsx", "utf8");
const layout = readFileSync("app/layout.tsx", "utf8");
const globals = readFileSync("app/globals.css", "utf8");
const management = readFileSync("app/management.css", "utf8");

describe("darkmode", () => {
  it("plaatst een toegankelijke schakelaar naast het profiel", () => {
    expect(nav).toMatch(/className="account-actions"[\s\S]*<ThemeToggle\s*\/>[\s\S]*className="avatar"/);
    expect(toggle).toContain('aria-label={dark?"Lichte modus inschakelen":"Donkere modus inschakelen"}');
    expect(toggle).toContain("Moon");
    expect(toggle).toContain("Sun");
  });

  it("onthoudt de keuze en past die voor het renderen toe", () => {
    expect(toggle).toContain('localStorage.setItem(storageKey,next)');
    expect(layout).toContain('localStorage.getItem("stickstat-theme")');
    expect(layout).toContain("suppressHydrationWarning");
  });

  it("heeft donkere kleuren voor basis- en beheeronderdelen", () => {
    expect(globals).toContain('html[data-theme="dark"]');
    expect(globals).toMatch(/color-scheme:\s*dark/);
    expect(management).toContain('html[data-theme="dark"] .roster-list');
    expect(management).toContain('html[data-theme="dark"] .recharts-default-tooltip');
  });
});
