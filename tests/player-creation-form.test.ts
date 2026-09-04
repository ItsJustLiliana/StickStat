import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const form = readFileSync("components/player-management-controls.tsx", "utf8");
const list = readFileSync("app/players/page.tsx", "utf8");
const details = readFileSync("app/players/[playerId]/page.tsx", "utf8");
const playerLinks = readFileSync("app/api/teams/[teamId]/player-links/route.ts", "utf8");
const route = readFileSync("app/api/teams/[teamId]/players/route.ts", "utf8");
const schema = readFileSync("prisma/schema.prisma", "utf8");

describe("speler toevoegen", () => {
  it("vraagt één volledige naam en splitst die automatisch", () => {
    expect(form).toContain('name="fullName"');
    expect(form).toContain("splitPlayerName");
    expect(form).toContain('"van","von"');
    expect(form).not.toContain('name="firstName"');
  });

  it("maakt de zichtbare naam op de server", () => {
    expect(route).toContain("[data.firstName,data.namePrefix,data.lastName].filter(Boolean).join");
    expect(schema).toContain("namePrefix String?");
  });

  it("houdt rugnummer en positie optioneel", () => {
    expect(form).toContain('className="player-detail-fields"');
    expect(form).toContain('placeholder="Rugnummer (optioneel)"');
    expect(form).toContain('placeholder="Positie (optioneel)"');
  });

  it("kan een speler veilig uit de actieve selectie verwijderen", () => {
    expect(form).toContain('"DELETE",{playerId}');
    expect(form).not.toContain('name="currentPassword"');
    expect(form).toContain("De speler wordt gearchiveerd");
    expect(route).toContain("data:{active:false,userId:null}");
    expect(route).toContain('filter(role=>role!=="player")');
  });

  it("laat alleen teambeheerders spelers maken, wijzigen en verwijderen", () => {
    expect(route.match(/authorizeTeamAdmin\(teamId\)/g)).toHaveLength(3);
    expect(route).toContain("export async function PATCH");
    expect(list).toMatch(/canAdmin\s*&&/);
    expect(list).toContain("<PlayerCreateControl");
    expect(details).toContain("canAdmin &&");
    expect(details).toContain("<PlayerDetailManagement");
  });

  it("opent gekoppelde spelers vanuit de spelerssectie als spelersprofiel", () => {
    expect(list).toContain('role==="player"&&player?`/players/${player.id}?team=${team.id}`');
  });

  it("ondersteunt trainingsleden en wedstrijdleden met beide als standaard", () => {
    expect(form).toContain('name="trainingMember"');
    expect(form).toContain('name="matchMember"');
    expect(form).toContain("trainingMember:training||!match");
    expect(form).toContain("matchMember:match||!training");
    expect(route).toContain("trainingMember:input.trainingMember");
    expect(route).toContain("matchMember:input.matchMember");
  });

  it("laat een teambeheerder een account van een speler ontkoppelen", () => {
    expect(form).toContain('title="Account ontkoppelen"');
    expect(form).toContain('`/api/teams/${teamId}/player-links`,"DELETE",{playerId}');
    expect(playerLinks).toContain("export async function DELETE");
    expect(playerLinks).toContain("authorizeTeamAdmin(teamId)");
    expect(playerLinks).toContain('filter(role=>role!=="player")');
  });
});
